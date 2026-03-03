#!/usr/bin/env python3
"""
EnergiRevision Knowledge Base Vectorizer
Vectorizes markdown files and NotebookLM content to Qdrant Cloud
"""

import os
import json
import subprocess
import hashlib
import requests
from pathlib import Path
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

QDRANT_URL = (
    "https://4edeb459-21c9-4b63-a5e2-0a136c5b136f.eu-west-1-0.aws.cloud.qdrant.io:6333"
)
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.Y0gaLbritNkLXHbP0xRmlS-vism0ZYqtRS4ytS7VMnQ"
COLLECTION_NAME = "EnergiRevision_Knowledge"

NOTEBOOK_ID = "1e07e631-ca32-4268-a0c1-58a4da269862"
PROJECT_ROOT = Path("/Users/imacpro/Documents/DEV-imac")

HF_API_URL = "https://api-inference.huggingface.co/pipeline/sentence-transformers/all-MiniLM-L6-v2"


def get_embedding(text):
    """Get embedding from HuggingFace API"""
    try:
        response = requests.post(
            HF_API_URL,
            headers={"Authorization": "Bearer INSERT_YOUR_HF_TOKEN"},
            json={"inputs": text},
        )
        if response.status_code == 200:
            return response.json()[0]
    except Exception as e:
        print(f"API error: {e}")

    text_hash = hashlib.sha256(text.encode()).digest()
    embedding = [float(b) / 255.0 for b in text_hash[:64]]
    while len(embedding) < 384:
        embedding.extend(embedding[:64])
    return embedding[:384]


def get_notebook_sources():
    """Get all sources from NotebookLM"""
    result = subprocess.run(
        ["nlm", "list", "sources", NOTEBOOK_ID], capture_output=True, text=True
    )
    return json.loads(result.stdout)


def get_markdown_files():
    """Get all markdown files from project"""
    md_files = []
    for pattern in ["**/*.md", "**/*.txt"]:
        md_files.extend(PROJECT_ROOT.glob(pattern))

    files_to_process = []
    skip_dirs = {
        ".git",
        "node_modules",
        ".venv",
        "AGENTZERO-imac",
        "A Volumes",
        "__pycache__",
        ".venv_vectorize",
    }

    for f in md_files:
        if not any(skip in str(f) for skip in skip_dirs):
            files_to_process.append(f)

    return files_to_process


def read_file_content(filepath):
    """Read content from a file"""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None


def chunk_text(text, chunk_size=1000, overlap=100):
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap

    return chunks


def connect_qdrant():
    """Connect to Qdrant Cloud"""
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    return client


def create_collection(client):
    """Create collection if not exists"""
    collections = client.get_collections().collections
    collection_names = [c.name for c in collections]

    if COLLECTION_NAME not in collection_names:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )
        print(f"Created collection: {COLLECTION_NAME}")
    else:
        print(f"Collection {COLLECTION_NAME} already exists")


def vectorize_and_upload(client, documents):
    """Vectorize documents and upload to Qdrant"""
    points = []
    point_id = 1

    print(f"Vectorizing {len(documents)} documents...")

    batch_size = 100
    total_uploaded = 0

    for doc in documents:
        chunks = chunk_text(doc["content"])

        for i, chunk in enumerate(chunks):
            if len(chunk.strip()) < 50:
                continue

            embedding = get_embedding(chunk)

            point = {
                "id": point_id,
                "vector": embedding,
                "payload": {
                    "source": doc["source"],
                    "title": doc["title"],
                    "chunk_index": i,
                    "content": chunk,
                },
            }
            points.append(point)
            point_id += 1

            if len(points) >= batch_size:
                client.upsert(collection_name=COLLECTION_NAME, points=points)
                total_uploaded += len(points)
                print(f"Uploaded {total_uploaded} points...")
                points = []

    if points:
        client.upsert(collection_name=COLLECTION_NAME, points=points)
        total_uploaded += len(points)

    print(f"Total uploaded: {total_uploaded} points to Qdrant")


def main():
    print("🚀 Starting vectorization...")

    client = connect_qdrant()
    create_collection(client)

    documents = []

    print("\n📚 Processing markdown files...")
    md_files = get_markdown_files()
    print(f"Found {len(md_files)} markdown/txt files")

    for f in md_files:
        content = read_file_content(f)
        if content:
            rel_path = f.relative_to(PROJECT_ROOT)
            documents.append(
                {"source": str(rel_path), "title": f.name, "content": content}
            )

    print("\n📡 Fetching NotebookLM sources...")
    try:
        sources = get_notebook_sources()
        print(f"Found {len(sources)} sources in NotebookLM")

        for source in sources:
            documents.append(
                {
                    "source": source.get("url", ""),
                    "title": source.get("title", "Unknown"),
                    "content": f"Source: {source.get('title', 'Unknown')}\nURL: {source.get('url', '')}\nType: {source.get('type', 'unknown')}",
                }
            )
    except Exception as e:
        print(f"Error fetching NotebookLM sources: {e}")

    if documents:
        vectorize_and_upload(client, documents)
    else:
        print("No documents to vectorize")


if __name__ == "__main__":
    main()
