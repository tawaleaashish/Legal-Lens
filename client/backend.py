import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Request , Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client, PostgrestAPIError as APIError
from pinecone import Pinecone
from uuid import uuid4
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv
from voyageai import Client as Voyage
import pymupdf as fitz
import pymupdf4llm
import time

# New imports
from pathlib import Path
from langchain_core.documents import Document
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from transformers import AutoTokenizer

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
genai.configure(api_key='AIzaSyCUFhAzkKjvYOoyDhuCwk1UkVrFC7UHmPI')

# Configure Voyage AI
voyage = Voyage(api_key="pa-BGEn0qb_-0HgMlpzE_TR9H1xKqr-qI7xmeRvYkb0aww")

# New constants for text splitting
MD_HEADER_SPLITTER = MarkdownHeaderTextSplitter(
    headers_to_split_on=[
        ("#", "1"),
        ("##", "2"),
        ("###", "3"),
        ("####", "4"),
        ("#####", "5"),
        ("######", "6"),
    ]
)

RECURSIVE_TEXT_SPLITTER = RecursiveCharacterTextSplitter(
    separators=[
        "\n\n",
        "\n",
        " ",
        ".",
        ",",
        "\u200b",  # Zero-width space
        "\uff0c",  # Fullwidth comma
        "\u3001",  # Ideographic comma
        "\uff0e",  # Fullwidth full stop
        "\u3002",  # Ideographic full stop
        "",
    ],
    chunk_size=1664,  # 1024+512+128
    chunk_overlap=352,  # 256+64+32
    length_function=len,
    is_separator_regex=False,
)

class QueryRequest(BaseModel):
    user_email: str | None
    query: str | None
    chat_id: str | None = None

class NewChatRequest(BaseModel):
    user_email: str

def expand_headers(header_info: dict[int, str]) -> str:
    header = ""
    for level, text in header_info.items():
        header += f"{'#' * int(level)} {text}\n"
    return header

def split_text_into_chunks(text: str) -> list[str]:
    docs: list[Document] = MD_HEADER_SPLITTER.split_text(text)

    if not docs:
        raise ValueError("MarkdownHeaderTextSplitter failed to split the text")

    chunks: list[str] = []

    for doc in docs:
        doc_chunks = RECURSIVE_TEXT_SPLITTER.split_text(doc.page_content)
        for chunk in doc_chunks:
            chunks.append(f"{expand_headers(doc.metadata)}\n{chunk}")

    return chunks

# def create_user_table_if_not_exists(user_email: str):
#     table_name = f"user_{user_email.replace('@', '_').replace('.', '_')}"
    
#     try:
#         supabase.table(table_name).select("*").limit(1).execute()
#         print(f"Table public.{table_name} already exists.")
        
#     except APIError as e:
#         error_message = str(e)
#         if 'relation' in error_message and 'does not exist' in error_message:
#             try:
#                 create_table_sql = f"""
#                 CREATE TABLE IF NOT EXISTS public.{table_name} (
#                     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
#                     chat_id UUID,
#                     chat_name TEXT,
#                     data JSON,
#                     query_response BOOLEAN,
#                     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
#                 );
#                 """
#                 supabase.rpc(create_table_sql).execute()
#                 print(f"Table public.{table_name} created successfully.")
#             except Exception as create_error:
#                 print(f"Error creating table public.{table_name}: {create_error}")
#                 raise HTTPException(status_code=500, detail=f"Error creating user table: {str(create_error)}")
#         else:
#             raise HTTPException(status_code=500, detail=f"API Error: {str(e)}")
    
#     except Exception as e:
#         print(f"Unexpected error with table public.{table_name}: {e}")
#         raise HTTPException(status_code=500, detail=f"Unexpected error with user table: {str(e)}")
    
#     return table_name

def upload_file_to_pinecone(user_email: str, chat_id: str, file_name: str, file_content: str):
    namespace = f"{user_email}_{chat_id}_{file_name}"
    
    # Convert the file content to markdown
    markdown_content = f"# {file_name}\n\n{file_content}"
    
    # Split the markdown content into chunks
    chunks = split_text_into_chunks(markdown_content)
    
    # Generate embeddings and upsert to Pinecone
    for chunk in chunks:
        # Generate embeddings using Voyage AI
        parts = voyage.embed(chunk,model="voyage-law-2",input_type="document").embeddings
        
        for part in parts:
            index.upsert(
                vectors=[
                    {
                        "id": str(uuid4()),
                        "values": part,
                        "metadata": {"content": chunk}
                    }
                ],
                namespace=namespace
            )
    
    print(f"File uploaded to Pinecone namespace: {namespace}")

def generate_chat_name(query: str) -> str:
    # Use Gemini to generate a chat name based on the first query
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"Give a title name for provided Query: {query}."
        response = model.generate_content(prompt)
        return response.text.strip()[:50]  # Limit to 50 characters
    except Exception as e:
        print(f"Error generating chat name: {e}")
        return f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"

def create_new_chat(user_email: str, query: str):
    chat_id = str(uuid4())
    chat_name = generate_chat_name(query)
    
    supabase.table("chats_data").insert({
        "chat_id": chat_id,
        "chat_name": chat_name,
        "user_email": user_email,
        "data": {},
        "query_response": False,
        "created_at": datetime.now().isoformat()
    }).execute()
    
    print(f"New chat created with ID: {chat_id} and name: {chat_name}")
    return chat_id, chat_name

def save_query_response(user_email: str, table_name: str, chat_id: str, is_query: bool, content: str, chat_name: str):
    supabase.table(table_name).insert({
        "chat_id": chat_id,
        "chat_name":chat_name,
        "user_email":user_email,
        "data": {"content": content},
        "query_response": is_query,
        "created_at": datetime.now().isoformat()
    }).execute()
    
    print(f"{'Query' if is_query else 'Response'} saved for chat ID: {chat_id}")

def get_chat_history(user_email: str, table_name: str, chat_id: str):
    response = supabase.table(table_name).select("*").eq("chat_id", chat_id).eq("user_email",user_email).order("created_at").execute()
    return response.data

def get_user_chats(user_email: str):
    try:
        response = supabase.table("chats_data").select(
            "chat_id", "chat_name"
        ).eq("user_email", user_email).eq("query_response",True).execute()
        
        # Process the response to get distinct chat_id and chat_name pairs
        distinct_chats = {}
        for row in response.data:
            chat_id = row['chat_id']
            chat_name = row['chat_name']
            if chat_id not in distinct_chats:
                distinct_chats[chat_id] = chat_name
        
        # Convert the dictionary to a list of dictionaries
        result = [{"chat_id": k, "chat_name": v} for k, v in distinct_chats.items()]
        
        return result
    except Exception as e:
        print(f"Error fetching user chats: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching user chats: {str(e)}")

def search_pinecone(user_email: str, chat_id: str, query: str, k=5):
    # Generate embeddings for the query using Voyage AI
    query_embedding = voyage.embed(query,model="voyage-law-2",input_type="document").embeddings

    user_prefix = f"{user_email}_{chat_id}_"
    # Get all namespaces that start with the user prefix
    user_namespaces = index.describe_index_stats()["namespaces"].keys()
    matching_user_namespaces = [ns for ns in user_namespaces if ns.startswith(user_prefix)]
    static_namespaces = ["cpc", "coi", "crpc", "ida", "iea", "ipc", "mva", "nia", "preamble"]
    # Combine user namespaces and static namespaces
    namespaces = matching_user_namespaces + static_namespaces
    combined_results=[]
    for namespace in namespaces:
        results = index.query(
            vector=query_embedding,
            namespace=namespace,
            top_k=k,
            include_metadata=True
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
        # prompt = f"Query: {query}\nContext: {context}\nPlease provide a response based on the given context."
        prompt = f"Imagine yourself as a lawyer/judge and an expert legal document analyst in India.You work with Constitution of India and all related documents. Provide a response based on the provided Query:{query}\nContext:{context}.Your response should be specific and related to the query asked and context provided.You can also use external reference as well to fill missing information from Indian law if provided information is not suitable.Format all responce in markdown form with bold headings."
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error in generating Gemini response: {e}")
        return "I'm sorry, but I couldn't generate a response at this time."

@app.post("/api/query")
async def handle_query(request: QueryRequest):
    user_email = request.user_email
    query = request.query
    chat_id = request.chat_id
    table_name="chats_data"
    
    # table_name = create_user_table_if_not_exists(user_email)
    
    if not chat_id:
        chat_id, chat_name = create_new_chat(user_email, query)
    else:
        chat_name = None
    
    save_query_response(user_email, table_name, chat_id, True, query,chat_name)
    
    search_results = search_pinecone(user_email, chat_id, query)
    llm_response = generate_llm_response(query, search_results)
    
    save_query_response(user_email, table_name, chat_id, False, llm_response,chat_name)
    
    return {"response": llm_response, "chat_id": chat_id, "chat_name": chat_name}

@app.get("/api/chat_history")
async def handle_chat_history(user_email: str, chat_id: str):
    if not chat_id:
        raise HTTPException(status_code=400, detail="chat_id is required")
    
    # table_name = create_user_table_if_not_exists(user_email)
    table_name="chats_data"
    history = get_chat_history(user_email, table_name, chat_id)
    return {"history": history}

@app.get("/api/user_chats")
async def handle_user_chats(user_email: str):
    chats = get_user_chats(user_email)
    return {"chats": chats}

@app.post("/api/new_chat")
async def handle_new_chat(request: NewChatRequest):
    user_email = request.user_email
    # table_name = create_user_table_if_not_exists(user_email)
    table_name="chats_data"
    chat_id = create_new_chat(user_email, table_name)
    return {"chat_id": chat_id}

@app.post("/api/upload_file")
async def handle_file_upload(
    user_email: str = Form(...),
    chat_id: str = Form(...),
    file: UploadFile = File(...)
):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    contents = await file.read()
    # file_content = contents.decode("utf-8")
    doc=fitz.open(stream=contents)
    file_content=pymupdf4llm.to_markdown(doc)

    if chat_id=="undefined":
        chat_id = str(uuid4())

    try:
        upload_file_to_pinecone(user_email, chat_id, file.filename, file_content)
        
        # Generate a response using the LLM
        # context = [{"content": f"File '{file.filename}' has been uploaded and processed."}]
        # llm_response = generate_llm_response("Summarize the uploaded file", context)
        
        # Save the upload event and LLM response to the chat history
        table_name = "chats_data"
        chat_name=str(f"{file.filename} uploaded")
        print(user_email, table_name, chat_id, True, f"Uploaded file: {file.filename}")
        save_query_response(user_email, table_name, chat_id, True, f"Uploaded file: {file.filename}",chat_name)
        # save_query_response(user_email, table_name, chat_id, False, llm_response)

        return {
            "message": "File uploaded and processed successfully",
            "file_name": file.filename
            # "response": llm_response
        }
    except Exception as e:
        print(f"Error processing uploaded file: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing uploaded file: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)