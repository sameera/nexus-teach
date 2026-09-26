---
title: "Workbook Name"
aliases: ["roadmap name", "workbook slug", "the name a roadmap is taught under", "default workbook name"]
touches: ["roadmap-naming", "workbook-store"]
domain: "roadmap-planning"
last_updated_by: "#108"
status: active
verification: verified
---

# Workbook Name

Every roadmap is taught in a workbook created under one name, and that name is the workbook's slug and the key the one interview is stored under. A name the lead gives is used as given. Without one, the name comes from an issue the roadmap was named by, and a roadmap named by a search must be given a name.

## How It Works

The planning phase passes a name only when the lead gave one, and it passes that name unchanged. It never makes up a name of its own. If it did, its name could differ from the one resolution would choose, and one roadmap would be split across two workbooks, each with its own interview.

Without a name, a roadmap named by an initiative takes that initiative's title, read once and only for naming. A roadmap named by epic numbers takes its lowest-numbered member's title. A search has no single issue to take a title from, so it always needs a name.

## Key Invariants

1. A name the lead gives is used exactly as given.
2. The planning phase never makes up a workbook name. Only resolution chooses one when the lead gave none.
3. A roadmap named by an initiative takes that initiative's title as its name, read once and only for naming; named by epic numbers it takes its lowest-numbered member's title.
4. A roadmap named by a search must be given a name.

## Integration Points

- [roadmap-naming](roadmap-naming.md) — says which issue the lead named the roadmap by, which is the issue an unnamed workbook takes its title from.
- [workbook-store](workbook-store.md) — takes the name settled here as the workbook's slug, which one interview per roadmap is keyed on.

## Decision Log

### 2026-09-26 — #108 — Split from roadmap-naming, and the name is optional for an epic or an initiative

The rules for the roadmap's name moved here from the naming page, which had reached its size limit. With this epic the planning phase stopped requiring a name for a roadmap named by an epic or an initiative. When the lead gives none, resolution takes it from the issue's title. The planning phase passes a name only when the lead gave one, and passes it as given. The name is the identity the one interview is keyed on. A name made up by the planning phase could differ from the name resolution chooses, and that would split one roadmap across two workbooks. A search still needs a name, because it has no issue to take a title from.
