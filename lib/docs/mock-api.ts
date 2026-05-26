/** Illustrative mock API shapes for Option A (support dashboard). Not executed at runtime. */
export function getSupportDashboardMockApi() {
  return {
    endpoints: [
      {
        method: "GET",
        path: "/api/tickets",
        description: "Ticket list for the Table binding",
        responseShape: {
          items: [
            {
              id: "TKT-001",
              subject: "Login issue",
              status: "open",
              assignee: "Alex",
              created: "2026-05-01T10:00:00Z",
            },
          ],
        },
        bindingNotes:
          "Table binding uses valuePath `items` to select the row array.",
      },
      {
        method: "GET",
        path: "/api/tickets/stats",
        description: "Headline metrics for Metric bindings",
        responseShape: {
          openCount: 42,
          urgentCount: 7,
        },
        bindingNotes:
          "Each Metric uses valuePath for a scalar field (e.g. `openCount`, `urgentCount`).",
      },
    ],
  };
}
