#!/usr/bin/env python3
"""
Browser-use test script
"""

import os
import asyncio
from browser_use import Agent
from langchain_openai import ChatOpenAI

API_KEY = "bu_tGoTZEli69AWqEjxJFjDlF1eCiuEtXD0P1Gox9dsOFA"


async def main():
    print("🚀 Starting browser-use test...")

    llm = ChatOpenAI(
        model="gpt-4o", api_key=API_KEY, base_url="https://api.browser-use.com/v1"
    )

    agent = Agent(
        task="What is the current gold price per gram in SEK?",
        llm=llm,
    )

    result = await agent.run()
    print("\n📊 Result:")
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
