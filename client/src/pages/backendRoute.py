from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from legal_lens_backend import (
    create_user_table_if_not_exists,
    create_new_chat,
    save_query_response,
    get_chat_history,
    search_pinecone,
    generate_llm_response
)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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