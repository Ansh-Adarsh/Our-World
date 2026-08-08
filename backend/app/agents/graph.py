"""
LangGraph Agentic Orchestration Engine.

Defines the specialized agent nodes and router logic for Our World:
1. Router Node: Analyzes incoming request intent.
2. Memory Agent: Generates poetic memory captions based on title & location.
3. Love Letter Agent: Drafts romantic messages & intimate letters.
4. Quiz Agent: Suggests playful trivia questions.
5. Story Agent: Weaves memory titles into narrative stories.
6. Surprise Agent: Generates romantic date night / gift ideas.
7. Birthday Agent (Stub): Reserved for Phase 5 cinematic experience.
"""
import logging
from typing import Dict, Any, TypedDict
from app.ai.groq_client import call_groq_llm

logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    intent: str
    context: Dict[str, Any]
    agent_name: str
    draft_content: str


async def route_and_execute_agent(intent: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph orchestration handler.
    Routes incoming intent to the appropriate agent node.
    """
    state: AgentState = {
        "intent": intent,
        "context": context,
        "agent_name": "RouterNode",
        "draft_content": "",
    }

    if intent == "memory_caption":
        return await memory_agent_node(state)
    elif intent == "love_letter":
        return await love_letter_agent_node(state)
    elif intent == "quiz_suggestion":
        return await quiz_agent_node(state)
    elif intent == "story_narrative":
        return await story_agent_node(state)
    elif intent == "surprise_idea":
        return await surprise_agent_node(state)
    elif intent == "birthday_experience":
        return await birthday_agent_node(state)
    else:
        return await default_agent_node(state)


async def memory_agent_node(state: AgentState) -> Dict[str, Any]:
    ctx = state["context"]
    title = ctx.get("title", "Special Moment")
    location = ctx.get("location", "")

    sys_prompt = "You are a warm, poetic relationship journaling assistant. Write a short, single-sentence romantic memory caption."
    usr_prompt = f"Title: {title}. Location: {location}. Generate a beautiful memory caption."

    content = await call_groq_llm(sys_prompt, usr_prompt, temperature=0.7, max_tokens=150)
    return {
        "intent": state["intent"],
        "agent_name": "MemoryAgent",
        "draft_content": content,
    }


async def love_letter_agent_node(state: AgentState) -> Dict[str, Any]:
    ctx = state["context"]
    topic = ctx.get("topic", "expressing gratitude and love")
    partner_name = ctx.get("partner_name", "My Love")

    sys_prompt = "You are an intimate love letter assistant. Write a heartfelt, elegant paragraph expressing love to your partner."
    usr_prompt = f"Partner: {partner_name}. Theme: {topic}. Write a romantic message."

    content = await call_groq_llm(sys_prompt, usr_prompt, temperature=0.8, max_tokens=300)
    return {
        "intent": state["intent"],
        "agent_name": "LoveLetterAgent",
        "draft_content": content,
    }


async def quiz_agent_node(state: AgentState) -> Dict[str, Any]:
    ctx = state["context"]
    topic = ctx.get("topic", "our couple memories")

    sys_prompt = "You are a playful couple trivia generator. Suggest 1 fun multiple-choice question with 4 options and the correct answer."
    usr_prompt = f"Topic: {topic}. Format: Question text | Option 1, Option 2, Option 3, Option 4."

    content = await call_groq_llm(sys_prompt, usr_prompt, temperature=0.7, max_tokens=250)
    return {
        "intent": state["intent"],
        "agent_name": "QuizAgent",
        "draft_content": content,
    }


async def story_agent_node(state: AgentState) -> Dict[str, Any]:
    ctx = state["context"]
    memories_list = ctx.get("memory_titles", ["First Coffee", "Sunset Walk"])

    sys_prompt = "You are a romantic storyteller. Weave the provided memory titles into a short, heartwarming narrative."
    usr_prompt = f"Memories: {', '.join(memories_list)}. Write a short story."

    content = await call_groq_llm(sys_prompt, usr_prompt, temperature=0.7, max_tokens=400)
    return {
        "intent": state["intent"],
        "agent_name": "StoryAgent",
        "draft_content": content,
    }


async def surprise_agent_node(state: AgentState) -> Dict[str, Any]:
    ctx = state["context"]
    preference = ctx.get("preference", "cozy evening")

    sys_prompt = "You are a romantic date night & surprise planner. Suggest 1 creative date night idea with step-by-step details."
    usr_prompt = f"Vibe preference: {preference}. Give 1 romantic date night plan."

    content = await call_groq_llm(sys_prompt, usr_prompt, temperature=0.8, max_tokens=300)
    return {
        "intent": state["intent"],
        "agent_name": "SurpriseAgent",
        "draft_content": content,
    }


async def birthday_agent_node(state: AgentState) -> Dict[str, Any]:
    ctx = state["context"]
    partner_name = ctx.get("partner_name", "My Partner")
    milestone = ctx.get("milestone", "another wonderful year around the sun")

    sys_prompt = "You are an intimate, poetic relationship birthday speech and letter writer. Write a breathtaking 3-paragraph birthday message filled with gratitude, joy, and hope for the future."
    usr_prompt = f"Partner: {partner_name}. Milestone: {milestone}. Write a cinematic birthday letter."

    content = await call_groq_llm(sys_prompt, usr_prompt, temperature=0.85, max_tokens=500)
    return {
        "intent": state["intent"],
        "agent_name": "BirthdayAgent",
        "draft_content": content,
    }


async def default_agent_node(state: AgentState) -> Dict[str, Any]:
    return {
        "intent": state["intent"],
        "agent_name": "DefaultAssistantAgent",
        "draft_content": "A romantic idea for us: Spend 15 minutes listening to our favorite memory song together tonight. ❤️",
    }
