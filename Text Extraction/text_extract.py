import json

# Load the JSON data from the file
file_path = "D:\Major Project\Legal-Lens\Text Extraction\cpc.json"
with open(file_path, 'r',encoding="utf-8") as file:
    data = json.load(file)

texts = []

# Create the markdown content
for section in data:
    markdown_content = ""

    section_number = section.get("section")
    title = section.get("title")
    description = section.get("description")
    
    # Add the section to the markdown content
    markdown_content += f"## Section {section_number}: {title}\n\n"
    markdown_content += f"{description}\n\n"

    # with open("D:\\Major Project\\Legal-Lens\\Text Extraction\\cpc\\" + f"{section_number if isinstance(section_number, int) else section_number.strip('.')}.md", "w", encoding="utf-8") as f:
    #     f.write(markdown_content)
    texts.append(markdown_content)


import voyageai
client = voyageai.Client(api_key="pa-BGEn0qb_-0HgMlpzE_TR9H1xKqr-qI7xmeRvYkb0aww")



# Save the markdown content to a file
output_path = "D:\\Major Project\\Legal-Lens\\Text Extraction\\cpc.md"
with open(output_path, 'w') as file:
    file.write(markdown_content)

with open(f"D:\Major Project\Legal-Lens\Text Extraction\cpc_chunks.json", "w", encoding="utf-8") as f:
    f.write(json.dumps(l_text))

print(f"Markdown file created at: {output_path}")