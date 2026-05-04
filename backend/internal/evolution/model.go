package evolution

// WebhookPayload is the top-level envelope sent by Evolution API.
type WebhookPayload struct {
	Event    string         `json:"event"`
	Instance string         `json:"instance"`
	Data     map[string]any `json:"data"`
}

// MessageData extracts the relevant fields from the 'data' map
// for a messages.upsert event.
type MessageData struct {
	RemoteJID string
	FromMe    bool
	PushName  string
	Body      string
}

// SendMessageRequest is used to send a WhatsApp message via Evolution API.
type SendMessageRequest struct {
	Number  string `json:"number"`
	Options struct {
		Delay int `json:"delay"`
	} `json:"options"`
	TextMessage struct {
		Text string `json:"text"`
	} `json:"textMessage"`
}

// SendMessageResponse is returned by Evolution API.
type SendMessageResponse struct {
	Key struct {
		RemoteJID string `json:"remoteJid"`
		ID        string `json:"id"`
	} `json:"key"`
	Status string `json:"status"`
}

// Instance represents an Evolution API instance (one per tenant).
type Instance struct {
	InstanceName string `json:"instanceName"`
	Status       string `json:"status"`
}

func parseMessageData(data map[string]any) *MessageData {
	md := &MessageData{}

	key, _ := data["key"].(map[string]any)
	if key != nil {
		md.RemoteJID, _ = key["remoteJid"].(string)
		md.FromMe, _ = key["fromMe"].(bool)
	}

	md.PushName, _ = data["pushName"].(string)

	// Try conversation (plain text) first, then extended text
	msg, _ := data["message"].(map[string]any)
	if msg != nil {
		if conv, ok := msg["conversation"].(string); ok && conv != "" {
			md.Body = conv
		} else if ext, ok := msg["extendedTextMessage"].(map[string]any); ok {
			md.Body, _ = ext["text"].(string)
		}
	}

	return md
}
