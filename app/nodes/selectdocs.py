from collections import Counter
from utils.state import State
def selectdocs(state: State) -> dict:
    docs = state["search_results"]
    doc_counter = Counter(
        (doc.metadata.get("source"), doc.metadata.get("page_label"))
        for doc in docs
    )

    most_common_keys = {
        key for key, _ in doc_counter.most_common(2)
    }

    common_docs = [
        doc for doc in docs
        if (doc.metadata.get("source"), doc.metadata.get("page_label")) in most_common_keys
    ]

    return {
        "common_results": common_docs
    }
