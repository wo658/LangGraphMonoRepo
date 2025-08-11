// Python 코드 스니펫과 자동완성을 위한 유틸리티
export const pythonSnippets = {
  langgraph_basic: `from langgraph import StateGraph, END
from typing import TypedDict

class AgentState(TypedDict):
    messages: list
    current_step: str

def node_function(state):
    # Your node logic here
    return state

workflow = StateGraph(AgentState)
workflow.add_node("node_name", node_function)
workflow.set_entry_point("node_name")
app = workflow.compile()`,

  conditional_edge: `def should_continue(state):
    # Add your condition logic here
    if condition:
        return "next_node"
    return END

workflow.add_conditional_edges(
    "source_node",
    should_continue,
    {
        "next_node": "target_node",
        END: END
    }
)`,

  state_definition: `class AgentState(TypedDict):
    messages: list
    current_step: str
    data: dict
    error: str`,
}

export const pythonKeywords = [
  "def",
  "class",
  "if",
  "else",
  "elif",
  "for",
  "while",
  "try",
  "except",
  "finally",
  "import",
  "from",
  "as",
  "return",
  "yield",
  "lambda",
  "with",
  "pass",
  "break",
  "continue",
  "True",
  "False",
  "None",
  "and",
  "or",
  "not",
  "in",
  "is",
]

export const langgraphKeywords = [
  "StateGraph",
  "END",
  "add_node",
  "add_edge",
  "add_conditional_edges",
  "set_entry_point",
  "compile",
  "TypedDict",
]
