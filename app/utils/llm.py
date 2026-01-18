from langchain.chat_models import init_chat_model

fast_llm = init_chat_model(
    model_provider="openai",
    model="gpt-4.1-mini",
    temperature=0
)

strong_llm = init_chat_model(
    model_provider="openai",
    model="gpt-4.1",
    temperature=0.2
)
