import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client , PostgrestAPIError as APIError
from pinecone import Pinecone
from uuid import uuid4
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv
from voyageai import Client as Voyage

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_url = 'https://nazhdcijmldlykjzkxxg.supabase.co'
supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hemhkY2lqbWxkbHlranpreHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTI2MzM2MSwiZXhwIjoyMDQwODM5MzYxfQ.s3nfj31QjNZuFaB6dOOQGuRqK5_Eysj6tzgTtbiSs-A'
supabase: Client = create_client(supabase_url, supabase_key)

# Initialize Pinecone
pinecone = Pinecone(api_key="0778b6c9-795c-4954-bf9d-3f1c9bfd09d6")
index = pinecone.Index("legallens")

# Configure the Gemini API
genai.configure(api_key='AIzaSyBbTYvtNqksIeWj7NItfl8wWaTyk9D6-DQ')

# Configure Voyage AI
voyage = Voyage(api_key="pa-BGEn0qb_-0HgMlpzE_TR9H1xKqr-qI7xmeRvYkb0aww")

class QueryRequest(BaseModel):
    user_email: str | None
    query: str | None
    chat_id: str | None = None

class NewChatRequest(BaseModel):
    user_email: str

def create_user_table_if_not_exists(user_email: str):
    table_name = f"user_{user_email.replace('@', '_').replace('.', '_')}"
    
    # Check if the table exists
    try:
        # Try to select from the table to see if it exists
        supabase.table(table_name).select("*").limit(1).execute()
        print(f"Table public.{table_name} already exists.")
        
    except APIError as e:
        error_message = str(e)
        # Check if the error is a "table does not exist" error
        if 'relation' in error_message and 'does not exist' in error_message:
            try:
                # Table doesn't exist, so create it
                # Table doesn't exist, so create it using raw SQL
                create_table_sql = f"""
                CREATE TABLE IF NOT EXISTS public.{table_name} (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    chat_id UUID,
                    chat_name TEXT,
                    data JSON,
                    query_response BOOLEAN,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                """
                
                # Run the SQL command to create the table
                supabase.rpc(create_table_sql).execute()
                print(f"Table public.{table_name} created successfully.")
            except Exception as create_error:
                print(f"Error creating table public.{table_name}: {create_error}")
                raise HTTPException(status_code=500, detail=f"Error creating user table: {str(create_error)}")
        else:
            # If it's a different kind of error, re-raise it
            raise HTTPException(status_code=500, detail=f"API Error: {str(e)}")
    
    except Exception as e:
        print(f"Unexpected error with table public.{table_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error with user table: {str(e)}")
    
    return table_name

def upload_file_to_pinecone(user_email: str, chat_id: str, file_name: str, file_content: str):
    namespace = f"{user_email}_{chat_id}_{file_name}"
    
    # Generate embeddings using Voyage AI
    embeddings = voyage.embed(file_content)
    
    index.upsert(
        vectors=[
            {
                "id": str(uuid4()),
                "values": embeddings,
                "metadata": {"content": file_content}
            }
        ],
        namespace=namespace
    )
    
    print(f"File uploaded to Pinecone namespace: {namespace}")

def create_new_chat(user_email: str, table_name: str):
    chat_id = str(uuid4())
    chat_name = f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    supabase.table(table_name).insert({
        "chat_id": chat_id,
        "chat_name": chat_name,
        "data": {},
        "query_response": False,
        "created_at": datetime.now().isoformat()
    }).execute()
    
    print(f"New chat created with ID: {chat_id}")
    return chat_id

def save_query_response(user_email: str, table_name: str, chat_id: str, is_query: bool, content: str):
    supabase.table(table_name).insert({
        "chat_id": chat_id,
        "data": {"content": content},
        "query_response": is_query,
        "created_at": datetime.now().isoformat()
    }).execute()
    
    print(f"{'Query' if is_query else 'Response'} saved for chat ID: {chat_id}")

def get_chat_history(user_email: str, table_name: str, chat_id: str):
    response = supabase.table(table_name).select("*").eq("chat_id", chat_id).order("created_at").execute()
    return response.data

def search_pinecone(user_email: str, chat_id: str, query: str, k=8):
    # Generate embeddings for the query using Voyage AI
    query_embedding = voyage.embed(query,model="voyage-law-2",input_type="document").embeddings

    namespaces=[f"{user_email}_{chat_id}_*","cpc"]
    combined_results=[]
    for namespace in namespaces:
        results = index.query(
            vector=query_embedding,
            namespace=namespace,
            top_k=k,
            include_metadata=True   # Search all namespaces for this user and chat
        )

        for match in results['matches']:
            combined_results.append({
                'namespace': namespace,
                'id': match['id'],
                'score': match['score'],
                'metadata': match.get('metadata',{})
            })
    combined_results = sorted(combined_results, key=lambda x: x['score'], reverse=True)
    combined_results=combined_results[:8]
    return [result['metadata'] for result in combined_results if 'metadata' in result]

def generate_llm_response(query: str, context: list):
    try:
        # Prepare the prompt
        prompt = f"Query: {query}\nContext: {context}\nPlease provide a response based on the given context."
        
        # Initialize the model
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Generate content
        response = model.generate_content(prompt)
        
        # Extract and return the generated text
        return response.text
    except Exception as e:
        print(f"Error in generating Gemini response: {e}")
        return "I'm sorry, but I couldn't generate a response at this time."

# @app.post("/api/query")
# async def query2(query: QueryRequest):
#     print(query)

@app.post("/api/query")
async def handle_query(request: QueryRequest):
    user_email = request.user_email
    query = request.query
    chat_id = request.chat_id
    
    table_name = create_user_table_if_not_exists(user_email)
    
    if not chat_id:
        chat_id = create_new_chat(user_email, table_name)
    
    # Save the query
    save_query_response(user_email, table_name, chat_id, True, query)
    
    # Search Pinecone and generate response
    search_results = search_pinecone(user_email, chat_id, query)
    llm_response = generate_llm_response(query, search_results)
    
    # Save the response
    save_query_response(user_email, table_name, chat_id, False, llm_response)
    
    return {"response": llm_response, "chat_id": chat_id}

@app.get("/api/chat_history")
async def handle_chat_history(user_email: str, chat_id: str):
    if not chat_id:
        raise HTTPException(status_code=400, detail="chat_id is required")
    
    table_name = create_user_table_if_not_exists(user_email)
    history = get_chat_history(user_email, table_name, chat_id)
    return {"history": history}

@app.post("/api/new_chat")
async def handle_new_chat(request: NewChatRequest):
    user_email = request.user_email
    table_name = create_user_table_if_not_exists(user_email)
    chat_id = create_new_chat(user_email, table_name)
    return {"chat_id": chat_id}

@app.post("/api/upload_file")
async def handle_file_upload(user_email: str, chat_id: str, file: UploadFile = File(...)):
    contents = await file.read()
    file_content = contents.decode("utf-8")
    
    # Create markdown file
    markdown_content = f"# {file.filename}\n\n{file_content}"
    
    # Upload to Pinecone
    upload_file_to_pinecone(user_email, chat_id, file.filename, markdown_content)
    
    return {"message": "File uploaded successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)