import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
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
    response = supabase.table(table_name).select("*").limit(1).execute()
    
    if "error" in response.model_dump(mode="python"):
        # Table doesn't exist, so create it
        supabase.table(table_name).create({
            "id": "uuid",
            "chat_id": "uuid",
            "chat_name": "text",
            "data": "jsonb",
            "query_response": "boolean",
            "created_at": "timestamp with time zone"
        })
        print(f"Table {table_name} created successfully.")
    else:
        print(f"Table {table_name} already exists.")
    
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

def search_pinecone(user_email: str, chat_id: str, query: str, top_k=8):
    # Generate embeddings for the query using Voyage AI
    query_embedding = voyage.embed(query)
    
    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True,
        namespace=f"{user_email}_{chat_id}_*"  # Search all namespaces for this user and chat
    )
    
    return [result.metadata["content"] for result in results.matches]

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