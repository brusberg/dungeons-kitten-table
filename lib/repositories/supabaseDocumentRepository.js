export function createSupabaseDocumentRepository(client) {
  return {
    async joinTable(code) {
      const { data, error } = await client
        .from("campaigns")
        .select("id, code, document, version")
        .eq("code", code)
        .single();

      if (error) throw error;

      return {
        tableId: data.id,
        code: data.code,
        campaign: {
          ...data.document,
          version: data.version
        }
      };
    },

    subscribeTable(tableId, onChange, onStatus = () => {}) {
      const channel = client
        .channel(`campaign:${tableId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "campaigns",
            filter: `id=eq.${tableId}`
          },
          (payload) => {
            onChange({
              type: "campaign",
              campaign: {
                ...payload.new.document,
                version: payload.new.version
              }
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "campaign_events",
            filter: `campaign_id=eq.${tableId}`
          },
          (payload) => {
            onChange({
              type: "event",
              event: {
                id: payload.new.id,
                type: payload.new.type,
                payload: payload.new.payload,
                createdAt: payload.new.created_at
              }
            });
          }
        )
        .subscribe((status) => onStatus(status));

      return () => client.removeChannel(channel);
    },

    async saveCampaign(tableId, campaign, baseVersion) {
      const { error } = await client.rpc("save_campaign_document", {
        table_id: tableId,
        base_version: baseVersion ?? campaign.version ?? null,
        next_document: campaign
      });

      if (error) throw error;
    },

    async appendEvent(tableId, event) {
      const { error } = await client.from("campaign_events").insert({
        campaign_id: tableId,
        type: event.type,
        payload: event.payload,
        created_at: event.createdAt
      });

      if (error) throw error;
    }
  };
}
