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
genai.configure(api_key='AIzaSyBbTYvtNqksIeWj7NItfl8wWaTyk9D6-DQ')

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
            print(chunk)

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
    print(file_name)
    markdown_content = f"# {file_name}\n\n{file_content}"
    
    # Split the markdown content into chunks
    chunks = split_text_into_chunks(markdown_content)
    print(chunks)
    
    # Generate embeddings and upsert to Pinecone
    # for chunk in chunks:
    #     # Generate embeddings using Voyage AI
    #     embeddings = voyage.embed(chunk)
        
    #     index.upsert(
    #         vectors=[
    #             {
    #                 "id": str(uuid4()),
    #                 "values": embeddings,
    #                 "metadata": {"content": chunk}
    #             }
    #         ],
    #         namespace=namespace
    #     )
    
    print(f"File uploaded to Pinecone namespace: {namespace}")

def create_new_chat(user_email: str, table_name: str):
    chat_id = str(uuid4())
    chat_name = f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    supabase.table(table_name).insert({
        "chat_id": chat_id,
        "chat_name": chat_name,
        "user_email":user_email,
        "data": {},
        "query_response": False,
        "created_at": datetime.now().isoformat()
    }).execute()
    
    print(f"New chat created with ID: {chat_id}")
    return chat_id

def save_query_response(user_email: str, table_name: str, chat_id: str, is_query: bool, content: str):
    supabase.table(table_name).insert({
        "chat_id": chat_id,
        "user_email":user_email,
        "data": {"content": content},
        "query_response": is_query,
        "created_at": datetime.now().isoformat()
    }).execute()
    
    print(f"{'Query' if is_query else 'Response'} saved for chat ID: {chat_id}")

def get_chat_history(user_email: str, table_name: str, chat_id: str):
    response = supabase.table(table_name).select("*").eq("chat_id", chat_id).eq("user_email",user_email).order("created_at").execute()
    return response.data

def search_pinecone(user_email: str, chat_id: str, query: str, k=5):
    # Generate embeddings for the query using Voyage AI
    query_embedding = voyage.embed(query,model="voyage-law-2",input_type="document").embeddings

    namespaces=[f"{user_email}_{chat_id}_*","cpc","coi","crpc","ida","iea","ipc","mva","nia","preamble"]
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
        prompt = f"Query: {query}\nContext: {context}\nPlease provide a response based on the given context."
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
        chat_id = create_new_chat(user_email, table_name)
    
    save_query_response(user_email, table_name, chat_id, True, query)
    
    search_results = search_pinecone(user_email, chat_id, query)
    llm_response = generate_llm_response(query, search_results)
    
    save_query_response(user_email, table_name, chat_id, False, llm_response)
    
    return {"response": llm_response, "chat_id": chat_id}

@app.get("/api/chat_history")
async def handle_chat_history(user_email: str, chat_id: str):
    if not chat_id:
        raise HTTPException(status_code=400, detail="chat_id is required")
    
    # table_name = create_user_table_if_not_exists(user_email)
    table_name="chats_data"
    history = get_chat_history(user_email, table_name, chat_id)
    return {"history": history}

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

    try:
        upload_file_to_pinecone(user_email, chat_id, file.filename, file_content)
        
        # Generate a response using the LLM
        # context = [{"content": f"File '{file.filename}' has been uploaded and processed."}]
        # llm_response = generate_llm_response("Summarize the uploaded file", context)
        
        # Save the upload event and LLM response to the chat history
        table_name = "chats_data"
        print(user_email, table_name, chat_id, False, f"Uploaded file: {file.filename}")
        save_query_response(user_email, table_name, chat_id, False, f"Uploaded file: {file.filename}")
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