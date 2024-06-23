from build import SimpleHNSW

from sentence_transformers import SentenceTransformer
from sentence_transformers.util import cos_sim

sentences = ["How do I get a replacement Medicare card?",
        "What is the monthly premium for Medicare Part B?",
        "How do I terminate my Medicare Part B (medical insurance)?",
        "How do I sign up for Medicare?",
        "Can I sign up for Medicare Part B if I am working and have health insurance through an employer?",
        "How do I sign up for Medicare Part B if I already have Part A?",
        "What are Medicare late enrollment penalties?",
        "What is Medicare and who can get it?",
        "How can I get help with my Medicare Part A and Part B premiums?",
        "What are the different parts of Medicare?",
        "Will my Medicare premiums be higher because of my higher income?",
        "What is TRICARE ?",
        "Should I sign up for Medicare Part B if I have Veterans' Benefits?"]

model = SentenceTransformer('thenlper/gte-small')
embeddings = model.encode(sentences)
print(embeddings[0])
print(cos_sim(embeddings[0], embeddings[1]))

# exit(0)

# Create an instance of SimpleHNSWIndex
hnsw = SimpleHNSW.SimpleHNSWIndex(L=5, mL=0.62, efc=10)

for embedding in embeddings:
    hnsw.insert(embedding)
# # Insert a vector
# hnsw.insert([1.0, 2.0, 3.0])
# hnsw.insert([ 1.0, 2.0, 3.0 ])
# hnsw.insert([ 1.0, 2.0, 3.1 ])
# hnsw.insert([ 1.1, 2.1, 3.0 ])
# hnsw.insert([ 1.1, 2.1, 3.1 ])
# Search for the nearest neighbors
query = model.encode("impact of higher income on medicare")
result = hnsw.search(query, 2)
print("Result", result)

# # Convert the index to JSON
# json_representation = hnsw.toJSON()
# print(json_representation)

# # Load an index from JSON
# hnsw_from_json = SimpleHNSW.SimpleHNSWIndex.fromJSON(json_representation)

