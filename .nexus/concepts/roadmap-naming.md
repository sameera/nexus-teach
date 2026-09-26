---
title: "Roadmap Naming"
aliases: ["naming a roadmap", "member limit", "epic cap", "search that names a roadmap", "initiative", "one number names a roadmap", "the epics beneath an initiative"]
touches: ["roadmap-resolution", "workbook-name"]
domain: "roadmap-planning"
last_updated_by: "#108"
status: active
verification: verified
---

# Roadmap Naming

A roadmap's member set is named in one of three ways: a list of epic issue numbers, one search that returns them, or one initiative issue number standing for the epics beneath it. Each way produces a plain set of numbers, and the member limit is checked against that set before any of them is read. The planning phase accepts all three.

## How It Works

The lead chooses exactly one of the three ways. Giving more than one is refused before anything runs, and the lead is asked nothing. A bare issue number always means an epic. An initiative is used only when the lead names it as one, and it is never recognised from the issue: the shared epic resolver has no such kind, so inferring one would mean owning a classification rule this repository never has.

Three refusals belong to naming rather than to resolution, because each is settled before any member is read: a set nobody named, a set larger than the limit, and an initiative with nothing beneath it. The last has its own name, because an empty initiative and an unnamed set are different problems to fix.

A search that names a roadmap to teach from keeps unplanned epics in. Every other search enumerating epics for planned work leaves them out.

## Key Invariants

1. Resolution receives a plain set of issue numbers and learns nothing about which way named it.
2. Nothing here declares a configuration key, a label or an issue type naming an initiative; the lead chooses that way rather than it being inferred.
3. An initiative's children are read in one call before the member limit is checked, and nothing about a child beyond its number is read then.
4. The member limit runs on the named set before anything is fetched and counts a planned and an unplanned member alike; a search asks for one row past it and refuses on the count.
5. An initiative with no children is refused under its own name, distinct from the refusal for a set nobody named, and names the initiative by issue number.
6. The learner's search expression stays untrusted input, passed as distinct arguments and never assembled into a shell string, and including unplanned epics drops the exclusion term rather than inverting the search.

## Integration Points

- [roadmap-resolution](roadmap-resolution.md) — takes the set of numbers named here and decides what each one becomes.
- [workbook-name](workbook-name.md) — takes the issue the lead named the roadmap by, and settles the name the workbook is created under.

## Decision Log

### 2026-09-20 — #65 — Split from roadmap-resolution, and one initiative number can now name a roadmap

Naming a roadmap and resolving its members were one page, and that page was full. This epic added a third way to name a roadmap, so the two were separated along the seam the implementation already used: naming settles which numbers a roadmap is built from, and resolution decides what each number becomes. The member limit, the search rules and the roadmap's own name moved here with it, because each is a property of the named set rather than of any member. An initiative is chosen by the lead directly and never recognised from the issue, because the shared resolver's kinds have no initiative case and read one as the same catch-all a bug or a chore falls into. There is no signal to found a rule on, so the only alternative to asking the lead was owning a brand-new classification rule with no counterpart upstream. Expansion then hands resolution a plain set of numbers, so the member limit, the member order and every refusal resolution already had apply to an initiative's children with no second copy of any of them. Three of the four behaviours this epic asked for needed no new rule at all for that reason: an oversized initiative meets the limit that already existed, and a child that is not an epic meets the refusal the shared resolver already raises. Only the empty initiative needed a refusal of its own, because the existing empty-set refusal is worded for a lead who named nothing and would have described the wrong problem. A roadmap named by an initiative takes that initiative's title as its name, read once and for nothing else: the name is the workbook's identity, and falling through to the lowest-numbered member would have slugged the workbook after whichever child happened to carry the lowest number, which is an accident of numbering and can move between runs as lower-numbered children are added. Refuted alternative: declare an initiative marker in this repository and resolve it through the shared configuration, matching how every other classification here already works, and letting a future release upstream supersede it. It lost on the size of the commitment, because this repository would be inventing and then maintaining a marker the installed package knows nothing about, where the earlier local workaround read a key that package already publishes. Refuted alternative: require the lead to name an initiative-resolved roadmap explicitly, as a search-resolved one already must be. It needs no extra read and no naming exception, but it lost on defeating the point: a search has no single issue to take a name from, an initiative does, and making the lead restate it reintroduces the typing this work exists to remove.

### 2026-09-26 — #108 — The planning phase accepts an initiative, and the name rules split out

The planning phase accepted an epic number or a search and nothing else, so a lead who gave it an initiative number had that number read as an epic and refused. It now accepts all three ways, and exactly one of them. An initiative is named only explicitly, and a bare issue number always means an epic. That keeps every existing invocation's meaning, and the phase never has to look up an issue's type before choosing how to resolve it. Giving more than one way is refused before anything runs, and the rule covers every pair, including an epic number with a search. The resolution beneath this phase was reused unchanged. Adding these rules took this page past its size limit, so the rules for the roadmap's name moved to their own page. The seam holds because naming the member set and naming the workbook are read by different tasks: the member limit and the refusals never depend on the name, and the workbook's identity never depends on the limit. The edge to the workbook store moved with the name. Refuted alternative: recognise an initiative from a bare number by reading its issue type. That is viable, but it makes the phase's behaviour depend on how an issue is classified, and the epic ruled it out of scope.
