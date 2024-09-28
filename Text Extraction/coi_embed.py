
import json
import time

import toolz

from voyageai import Client as Voyage
from pinecone import Pinecone



voyage = Voyage(api_key="pa-BGEn0qb_-0HgMlpzE_TR9H1xKqr-qI7xmeRvYkb0aww")

pinecone = Pinecone(api_key="0778b6c9-795c-4954-bf9d-3f1c9bfd09d6")
pc_index = pinecone.Index("legallens")

ORIGINAL_JSON = []

with open(r"D:\Major Project\Legal-Lens\Text Extraction\preamble.json", "r", encoding="utf-8") as og_file:
    ORIGINAL_JSON = json.load(og_file)

def generate_id(metadata):
    id=""
    if 'article' in metadata:
        if id: id += "-"
        id += f'article-{metadata["article"]}'
    if 'section' in metadata:
        if id: id += "-"
        id += f"section-{metadata['section']}"
    
    return {**metadata, 'id':id}

def transform_chunk(json_piece: dict[str, int|str]):
    output_chunk = ""
    metadata = {}

    n_article = json_piece.get('article')
    t_article = json_piece.get('article_title')

    if n_article:
        metadata['article'] = n_article

    if (n_article and t_article):
        output_chunk += f"# {n_article}:{t_article}"

    n_section = json_piece.get("Section") or json_piece.get('section')
    t_section = json_piece.get("section_title") or json_piece.get('title')

    if n_section:
        metadata['section'] = f"{n_section if isinstance(n_section, int) else n_section.strip('.')}"

    if (n_section and t_section):
        output_chunk += f"## {metadata['section']}: {t_section}"
    
    text = json_piece.get('description')
    if not text:
        text = json_piece.get('section_desc')

    output_chunk += f"{text}"
    metadata['text'] = output_chunk

    return output_chunk, metadata

# print(transform_chunk(ORIGINAL_JSON[128]))



converted = [
    transform_chunk(a) for a in ORIGINAL_JSON
]

partitioned = toolz.partition_all(10, converted)


# print(len(list(partitioned)))

# exit(0)

embeddable_parts = []
for i, part in enumerate(partitioned):
    part_ids = [generate_id(chunk[1])['id'] for chunk in part]
    part_values = voyage.embed(
        [chunk[0] for chunk in part],
        model="voyage-law-2",
        input_type="document",
    ).embeddings
    part_metadata = [chunk[1] for chunk in part]

    new_part = [{'id':a, 'values':b, 'metadata': c} for a, b, c in zip(part_ids, part_values, part_metadata)]
    
    embeddable_parts.append(new_part)
    print(f"Embedded Chunk {i}")
    # time.sleep(30)


# print(embeddable_parts[0][48])


for i, part in enumerate(embeddable_parts):
    pc_index.upsert(
        vectors=part,
        namespace="preamble"
    )
    print(f"{10*(i+1)} vectors done.")
