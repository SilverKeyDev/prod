# Home matching — preprocessing

Prepares user/home inputs for **embedding**, **LLM**, and tabular scorers from a shared dictionary format.

## Data flow

```
DB/API → dict (standard) → Embedding*Input | LLM*Input | tabular features
```

| Model family | Purpose |
| ------------ | ------- |
| `EmbeddingHomeInput` / `EmbeddingUserInput` | Text + structured features for embeddings |
| `LLMHomeInput` / `LLMUserInput` | `format_for_prompt()` for LLM scorers |

## Usage (summary)

```python
from app.home_matching.preprocessing.models import UserDataRetriever, HomeDataRetriever

user_data = UserDataRetriever.from_database(user_id="123")
embedding_user = UserDataRetriever.to_embedding_input(user_data)
llm_user = UserDataRetriever.to_llm_input(user_data)
```

Scorers accept dicts via `to_dict()` for backward compatibility. Prefer model helpers (`extract_text_features()`, `format_for_prompt()`) over manual dict shaping.

## Layout

```
preprocessing/
├── models/           # base, embedding_input, llm_input, data_retrieval
├── home_input_data.py
├── user_input_data.py
└── README.md
```

## Related modules

- [embeddings/README.md](../embeddings/README.md)
- [postprocessing/README.md](../postprocessing/README.md)
- Parent search services under `Server/app/services/search/`
