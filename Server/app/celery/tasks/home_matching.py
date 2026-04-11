from app.celery.celery_worker import celery


# Home Matching Tasks
@celery.task(name="tasks.find_best_matches_task", bind=True)
def find_best_matches_task(
    self,
    user_data,
    homes_data,
    top_k=10,
    include_explanations=False,
    embedding_provider="sentence_transformer",
):
    """
    Celery task to find the best home matches for a user.

    Args:
        user_data: User preferences and profile data
        homes_data: List of home listings to match against
        top_k: Number of top matches to return
        include_explanations: Whether to include explanations (currently unused)
        embedding_provider: Embedding model provider

    Returns:
        List of top-k home matches with scores
    """
    try:
        # Update task progress
        self.update_state(
            state="PROGRESS", meta={"status": "Initializing home matching system", "progress": 10}
        )

        # Import the home matching function
        from app.services.search.home_matching.config.match import find_best_matches

        # Update progress
        self.update_state(state="PROGRESS", meta={"status": "Finding best matches", "progress": 50})

        # Call the home matching function
        matches = find_best_matches(
            user_data=user_data,
            homes_data=homes_data,
            top_k=top_k,
            include_explanations=include_explanations,
            embedding_provider=embedding_provider,
        )

        # Update progress
        self.update_state(state="PROGRESS", meta={"status": "Finalizing results", "progress": 90})

        return {
            "success": True,
            "matches": matches,
            "user_id": user_data.get("user_id"),
            "homes_processed": len(homes_data),
            "matches_found": len(matches),
            "top_k": top_k,
            "include_explanations": include_explanations,
        }

    except Exception as e:
        return {"success": False, "error": str(e), "user_id": user_data.get("user_id", "unknown")}
