

#                                  TESTER CODE TO TEST WHETHER GOOGLE API KEY IS WORKING OR NOT
# import os
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from dotenv import load_dotenv
# import google.generativeai as genai

# # Load environment variables
# load_dotenv()

# # Initialize Flask app
# app = Flask(__name__)
# CORS(app)  # Enable CORS for all routes

# # Print Google API Key for debugging
# google_api_key = os.getenv("GOOGLE_API_KEY")
# print("Google API Key:", google_api_key)

# # Configure the Gemini API with the Google API key
# try:
#     genai.configure(api_key=google_api_key)
# except Exception as e:
#     print(f"Error initializing Google API: {e}")

# def generate_llm_response(query, context):
#     try:
#         # Prepare the prompt
#         prompt = f"Query: {query}\nContext: {context}\nPlease provide a response based on the given context."
        
#         # Initialize the model
#         model = genai.GenerativeModel('gemini-1.5-flash')
        
#         # Generate content
#         response = model.generate_content(prompt)
        
#         # Extract and return the generated text
#         return response.text
#     except Exception as e:
#         print(f"Error in generating Gemini response: {e}")
#         return "I'm sorry, but I couldn't generate a response at this time."

# @app.route('/api/query', methods=['POST'])
# def handle_query():
#     data = request.json
#     query = data.get('query')

#     # Use an empty context for now
#     context = []

#     # Generate response using Google API
#     llm_response = generate_llm_response(query, context)

#     return jsonify({
#         'response': llm_response
#     })

# if __name__ == '__main__':
#     app.run(debug=True)


#                                                             MAIN CODE
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client, Client
from pinecone import Pinecone
from uuid import uuid4
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Initialize Pinecone
pinecone = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pinecone.Index("legal-lens-index")

# Configure the Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def create_user_table_if_not_exists(user_email):
    table_name = f"user_{user_email.replace('@', '_').replace('.', '_')}"
    
    # Check if the table exists
    response = supabase.table(table_name).select("*").limit(1).execute()
    
    if "error" in response:
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

def upload_file_to_pinecone(user_email, chat_id, file_name, file_content):
    namespace = f"{user_email}_{chat_id}_{file_name}"
    
    # Here you would typically use a text embedding model to convert the file_content to a vector
    # For this example, we'll use a dummy vector
    dummy_vector = [0.1] * 1536  # Assuming 1536-dimensional embeddings
    
    index.upsert(
        vectors=[
            {
                "id": str(uuid4()),
                "values": dummy_vector,
                "metadata": {"content": file_content}
            }
        ],
        namespace=namespace
    )
    
    print(f"File uploaded to Pinecone namespace: {namespace}")

def create_new_chat(user_email, table_name):
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

def save_query_response(user_email, table_name, chat_id, is_query, content):
    supabase.table(table_name).insert({
        "chat_id": chat_id,
        "data": {"content": content},
        "query_response": is_query,
        "created_at": datetime.now().isoformat()
    }).execute()
    
    print(f"{'Query' if is_query else 'Response'} saved for chat ID: {chat_id}")

def get_chat_history(user_email, table_name, chat_id):
    response = supabase.table(table_name).select("*").eq("chat_id", chat_id).order("created_at").execute()
    return response.data

def search_pinecone(user_email, chat_id, query, top_k=8):
    # Here you would typically use a text embedding model to convert the query to a vector
    # For this example, we'll use a dummy vector
    dummy_vector = [0.1] * 1536  # Assuming 1536-dimensional embeddings
    
    results = index.query(
        vector=dummy_vector,
        top_k=top_k,
        include_metadata=True,
        namespace=f"{user_email}_{chat_id}_*"  # Search all namespaces for this user and chat
    )
    
    return [result.metadata["content"] for result in results.matches]

def generate_llm_response(query, context):
    try:
        # Prepare the prompt
        prompt = f"Query: {query}\nContext: {context}\nPlease provide a response based on the given context."
        
        # Initialize the model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate content
        response = model.generate_content(prompt)
        
        # Extract and return the generated text
        return response.text
    except Exception as e:
        print(f"Error in generating Gemini response: {e}")
        return "I'm sorry, but I couldn't generate a response at this time."

@app.route('/api/query', methods=['POST'])
def handle_query():
    data = request.json
    user_email = data.get('user_email', 'default@example.com')  # In production, get this from authentication
    query = data.get('query')
    chat_id = data.get('chat_id')
    
    if not chat_id:
        chat_id = create_new_chat(user_email, create_user_table_if_not_exists(user_email))
    
    # Save the query
    save_query_response(user_email, create_user_table_if_not_exists(user_email), chat_id, True, query)
    
    # Search Pinecone and generate response
    search_results = search_pinecone(user_email, chat_id, query)
    llm_response = generate_llm_response(query, search_results)
    
    # Save the response
    save_query_response(user_email, create_user_table_if_not_exists(user_email), chat_id, False, llm_response)
    
    return jsonify({
        'response': llm_response,
        'chat_id': chat_id
    })

@app.route('/api/chat_history', methods=['GET'])
def handle_chat_history():
    user_email = request.args.get('user_email', 'default@example.com')  # In production, get this from authentication
    chat_id = request.args.get('chat_id')
    
    if not chat_id:
        return jsonify({'error': 'chat_id is required'}), 400
    
    history = get_chat_history(user_email, create_user_table_if_not_exists(user_email), chat_id)
    return jsonify(history)

@app.route('/api/new_chat', methods=['POST'])
def handle_new_chat():
    data = request.json
    user_email = data.get('user_email', 'default@example.com')  # In production, get this from authentication
    
    chat_id = create_new_chat(user_email, create_user_table_if_not_exists(user_email))
    return jsonify({'chat_id': chat_id})

if __name__ == '__main__':
    app.run(debug=True)










