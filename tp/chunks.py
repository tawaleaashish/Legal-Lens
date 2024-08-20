# import json
# import os

# def json_to_markdown(json_data):
#     md_content = ""
    
#     def process_dict(d, level=1):
#         nonlocal md_content
#         for key, value in d.items():
#             # Convert key to a header based on the level
#             md_content += f"{'#' * level} {key}\n\n"
            
#             if isinstance(value, dict):
#                 # If the value is another dict, recurse with the next level of headers
#                 process_dict(value, level + 1)
#             elif isinstance(value, list):
#                 # If the value is a list, iterate over the items
#                 for item in value:
#                     if isinstance(item, dict):
#                         process_dict(item, level + 1)
#                     else:
#                         md_content += f"- {item}\n"
#                 md_content += "\n"
#             else:
#                 # For normal text values, just add them
#                 md_content += f"{value}\n\n"

#     process_dict(json_data)
#     return md_content

# def split_markdown_by_headers(md_content):
#     chunks = []
#     chunk = ""
#     lines = md_content.splitlines()
    
#     for line in lines:
#         if line.startswith("#"):  # Detect headers
#             if chunk:
#                 chunks.append(chunk)
#             chunk = line + "\n"  # Start a new chunk with this header
#         else:
#             chunk += line + "\n"
    
#     if chunk:
#         chunks.append(chunk)  # Add the final chunk

#     return chunks

# def save_chunks_to_files(chunks, base_filename):
#     for idx, chunk in enumerate(chunks):
#         filename = f"{base_filename}_chunk_{idx + 1}.md"
#         with open(filename, "w") as f:
#             f.write(chunk)

# def convert_json_to_md_and_split(json_file, output_base_filename):
#     with open(json_file, 'r') as f:
#         json_data = json.load(f)
    
#     # Convert JSON to Markdown
#     markdown_content = json_to_markdown(json_data)
    
#     # Split Markdown by headers and subheaders
#     markdown_chunks = split_markdown_by_headers(markdown_content)
    
#     # Save each chunk to a separate file
#     save_chunks_to_files(markdown_chunks, output_base_filename)

# # Example usage
# # json_file_path = r"E:\Mega Project\Legal Lens\Legal-Lens-branch-1\tp\tp.json"
# json_file_path = 'E:\\Mega Project\\Legal Lens\\Legal-Lens-branch-1\\tp\\tp.json'

# output_base_filename = 'output_markdown'

# convert_json_to_md_and_split(json_file_path, output_base_filename)


# import json
# import os

# def json_to_markdown(json_data):
#     md_content = ""

#     def process_dict(d, level=1):
#         nonlocal md_content
#         for key, value in d.items():
#             md_content += f"{'#' * level} {key}\n\n"
            
#             if isinstance(value, dict):
#                 process_dict(value, level + 1)
#             elif isinstance(value, list):
#                 for item in value:
#                     if isinstance(item, dict):
#                         process_dict(item, level + 1)
#                     else:
#                         md_content += f"- {item}\n"
#                 md_content += "\n"
#             else:
#                 md_content += f"{value}\n\n"

#     def process_list(l, level=1):
#         nonlocal md_content
#         for item in l:
#             if isinstance(item, dict):
#                 process_dict(item, level)
#             else:
#                 md_content += f"- {item}\n"
    
#     # Check if root is a dictionary or list and process accordingly
#     if isinstance(json_data, dict):
#         process_dict(json_data)
#     elif isinstance(json_data, list):
#         process_list(json_data)
    
#     return md_content

# def split_markdown_by_headers(md_content):
#     chunks = []
#     chunk = ""
#     lines = md_content.splitlines()
    
#     for line in lines:
#         if line.startswith("#"):
#             if chunk:
#                 chunks.append(chunk)
#             chunk = line + "\n"
#         else:
#             chunk += line + "\n"
    
#     if chunk:
#         chunks.append(chunk)
    
#     return chunks

# def save_chunks_to_files(chunks, base_filename):
#     for idx, chunk in enumerate(chunks):
#         filename = f"{base_filename}_chunk_{idx + 1}.md"
#         with open(filename, "w") as f:
#             f.write(chunk)

# def convert_json_to_md_and_split(json_file, output_base_filename):
#     with open(json_file, 'r') as f:
#         json_data = json.load(f)
    
#     markdown_content = json_to_markdown(json_data)
    
#     markdown_chunks = split_markdown_by_headers(markdown_content)
    
#     save_chunks_to_files(markdown_chunks, output_base_filename)

# # Example usage
# # json_file_path = r'E:\Mega Project\Legal Lens\Legal-Lens-branch-1\tp\tp.json'
# json_file_path = 'E:\\Mega Project\\Legal Lens\\Legal-Lens-branch-1\\tp\\tp.json'
# output_base_filename = 'output_markdown'

# convert_json_to_md_and_split(json_file_path, output_base_filename)



# import json

# def json_to_markdown(json_data):
#     md_content = ""

#     for entry in json_data:
#         # Add header for the article
#         md_content += f"# Article {entry.get('article', 'N/A')}: {entry.get('title', 'No Title')}\n\n"
#         # Add the description of the article
#         md_content += f"{entry.get('description', '')}\n\n"
    
#     return md_content

# def split_markdown_by_headers(md_content):
#     chunks = []
#     chunk = ""
#     lines = md_content.splitlines()
    
#     for line in lines:
#         # Check if the line starts with "# Article", indicating a new chunk
#         if line.startswith("# Article"):
#             if chunk:
#                 chunks.append(chunk)
#             chunk = line + "\n"
#         else:
#             chunk += line + "\n"
    
#     if chunk:
#         chunks.append(chunk)
    
#     return chunks

# def save_chunks_to_files(chunks, base_filename):
#     for idx, chunk in enumerate(chunks):
#         filename = f"{base_filename}_chunk_{idx + 1}.md"
#         with open(filename, "w") as f:
#             f.write(chunk)

# def convert_json_to_md_and_split(json_file, output_base_filename):
#     with open(json_file, 'r') as f:
#         json_data = json.load(f)
    
#     # Convert the JSON to markdown format
#     markdown_content = json_to_markdown(json_data)
    
#     # Split the markdown content by top-level headers (articles)
#     markdown_chunks = split_markdown_by_headers(markdown_content)
    
#     # Save the chunks into separate markdown files
#     save_chunks_to_files(markdown_chunks, output_base_filename)

# # Example usage
# # json_file_path = r'E:\Mega Project\Legal Lens\Legal-Lens-branch-1\tp\tp.json'
# json_file_path = 'E:\\Mega Project\\Legal Lens\\Legal-Lens-branch-1\\tp\\tp.json'
# output_base_filename = 'output_markdown'

# convert_json_to_md_and_split(json_file_path, output_base_filename)


import json

def json_to_chunks(json_data):
    chunks = []

    for entry in json_data:
        # Create a chunk for each article
        chunk = {
            "article": entry.get("article", 'N/A'),
            "title": entry.get("title", "No Title"),
            "description": entry.get("description", "")
        }
        chunks.append(chunk)

    return chunks

def save_chunks_to_json(chunks, output_filename):
    # Save the chunks into a single JSON file
    with open(output_filename, "w") as f:
        json.dump(chunks, f, indent=4)

def convert_json_to_chunks(json_file, output_filename):
    # Load the input JSON file
    with open(json_file, 'r') as f:
        json_data = json.load(f)
    
    # Convert JSON data into chunks
    chunks = json_to_chunks(json_data)
    
    # Save the chunks into a single JSON file
    save_chunks_to_json(chunks, output_filename)

# Example usage
# json_file_path = r'E:\Mega Project\Legal Lens\Legal-Lens-branch-1\tp\tp.json'
json_file_path = 'E:\\Mega Project\\Legal Lens\\Legal-Lens-branch-1\\tp\\tp.json'
output_filename = 'output_article_chunks.json'

convert_json_to_chunks(json_file_path, output_filename)
