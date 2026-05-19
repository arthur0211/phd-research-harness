# Tool Connectors

PhD research depends on external tools — literature databases, screening
software, RAG engines, reference managers, federated-login portals. This plugin
references those tools through **tool-agnostic categories**. You map your tool of
choice per category in `.claude/settings.local.json`.

Skills reference categories (e.g. `${connectors.literature-database}`); they
never hardcode a specific vendor. Swap a connector and the skills keep working.

## Categories

### `literature-database` (search source)

| Tool                | Cost      | Credentials       | Coverage                      | Notes                                                  |
|---------------------|-----------|-------------------|-------------------------------|--------------------------------------------------------|
| **OpenAlex**        | free      | none              | 240M+ works, all fields       | recommended default; public REST API                   |
| **Semantic Scholar**| free      | none (optional key)| 200M+ works, all fields      | strong on citation counts + tldr summaries; MCP available |
| **Crossref**        | free      | none              | 150M+ DOIs, all fields        | metadata only (no abstracts); great for citation verification |
| **PubMed**          | free      | none              | 35M biomedical                | biomed/health only                                     |
| **arXiv**           | free      | none              | 2.5M physics/CS preprints     | preprints only                                         |
| **Scopus**          | paid      | `SCOPUS_API_KEY` env OR institutional portal | 90M+ multi-disciplinary | export API requires institutional license             |
| **Web of Science**  | paid      | `WOS_API_KEY` env OR institutional portal | 80M+ multi-disciplinary | Clarivate license required                    |
| **EBSCO**           | paid      | institutional portal only | varies by license     | no clean public API for most subscriptions             |
| **ProQuest**        | paid      | institutional portal only | dissertations + journals | manual export workflow only                       |

### `screening-tool` (title/abstract triage at scale)

| Tool          | Cost                | Model        | Notes                                              |
|---------------|---------------------|--------------|----------------------------------------------------|
| **ASReview**  | free / open source  | active learning | Python; `pip install asreview`; recommended for N>200 |
| **Rayyan**    | free SaaS           | manual + AI hints | web-based collaborative screening               |
| **Covidence** | paid SaaS           | manual workflow | many institutional Cochrane subscriptions       |
| **DistillerSR** | paid SaaS         | manual + AI    | enterprise-grade audit trails                    |

### `rag-engine` (PDF retrieval + extraction over your library)

| Tool         | Cost          | Local/Cloud | Notes                                                  |
|--------------|---------------|-------------|--------------------------------------------------------|
| **PaperQA2** | free          | local       | `pip install 'paper-qa==2025.*'`; works against Zotero library |
| **Elicit**   | paid          | cloud       | strong extraction templates; pricing per query        |
| **Undermind**| free + paid tiers | cloud   | deep semantic search; web UI                          |
| **Scite.ai** | paid          | cloud       | citation context (supporting/contrasting); web UI     |

### `reference-manager`

| Tool                | Cost          | Local API           | Notes                                          |
|---------------------|---------------|---------------------|------------------------------------------------|
| **Zotero**          | free          | yes (port 23119)    | recommended default; MCP available; Better-BibTeX export |
| **Mendeley**        | free          | limited             | Elsevier-owned; less open API                  |
| **EndNote**         | paid          | no                  | Clarivate; institutional licenses common       |
| **Citavi**          | paid          | local DB            | strong on knowledge organization               |
| **Paperpile**       | paid SaaS     | no                  | Google-integrated                              |

### `manual-portal` (institutional federated login)

| Portal              | Region           | Notes                                                   |
|---------------------|------------------|---------------------------------------------------------|
| **CAFe / CAPES**    | Brazil           | https://www.periodicos.capes.gov.br/; covers most BR universities |
| **OpenAthens**      | EU + some US     | federated SSO; common in UK/EU/health sciences          |
| **Shibboleth**      | US + EU          | federated SSO; common in US R1 universities             |
| **Direct VPN**      | varies           | when no federation; institutional VPN required          |

> ⚠️ **Login automation limit**: no LLM agent can perform institutional federated
> login (CAPTCHA, MFA, federation handshake). The `manual-search-protocol` skill
> documents step-by-step the human-only parts and the handoff to skills that CAN
> automate (`screening-workflow`, dedup, BibTeX parsing).

## Mapping in `settings.local.json`

```json
{
  "connectors": {
    "literature-database": ["openalex", "semantic-scholar"],
    "screening-tool": ["asreview"],
    "rag-engine": ["paperqa2"],
    "reference-manager": ["zotero"],
    "manual-portal": ["cafe-capes"]
  }
}
```

Multiple values per category are allowed — skills will try them in order. The
first one with credentials/availability wins per call.

## Adding a new connector

1. Pick the category that fits (or open a PR to add a new category if none fits).
2. Add a row to the table above (in your fork or local copy).
3. Reference it in `settings.local.json`.
4. The skills will pick it up by name; no skill code needs to change.

## Why this design (vs. hardcoded MCPs)

- MCPs are opinionated about specific vendors; they break when a vendor pivots.
- Public REST APIs (OpenAlex, Crossref, Semantic Scholar) have outlived multiple
  MCP wrappers. WebFetch is the lowest-common-denominator transport.
- Institutional portals (CAFe, OpenAthens) can never be automated by an agent;
  pretending otherwise misleads users. The category exists to *document* what
  the human has to do, not what the agent will do.
- Skills designed around categories survive vendor churn. Skills designed
  around `mcp__plugin_elicit_elicit__search` die when the MCP is removed.
