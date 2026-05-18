package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const openRouterURL = "https://openrouter.ai/api/v1/chat/completions"

type Service struct {
	apiKey string
	model  string
	client *http.Client
}

func NewService(apiKey, model string) *Service {
	if model == "" {
		model = "openai/gpt-4o-mini"
	}
	return &Service{
		apiKey: apiKey,
		model:  model,
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

// ClassifyLead returns a short classification label for a lead based on their message.
func (s *Service) ClassifyLead(ctx context.Context, name, message string) (string, error) {
	prompt := fmt.Sprintf(
		"Você é um classificador de leads para uma revenda de veículos. "+
			"Classifique o interesse do lead em uma única palavra: "+
			"'QUENTE' (quer comprar logo), 'MORNO' (interesse moderado) ou 'FRIO' (só curiosidade).\n"+
			"Lead: %s\nMensagem: %s\nResponda apenas com a palavra.",
		name, message,
	)

	resp, err := s.complete(ctx, prompt)
	if err != nil {
		return "", err
	}

	label := strings.TrimSpace(strings.ToUpper(resp))
	switch label {
	case "QUENTE", "MORNO", "FRIO":
		return label, nil
	default:
		return "FRIO", nil
	}
}

// SuggestReply generates a suggested WhatsApp reply for a lead.
func (s *Service) SuggestReply(ctx context.Context, storeName, vehicleTitle, leadMessage string) (string, error) {
	prompt := fmt.Sprintf(
		"Você é um atendente da revenda '%s'. "+
			"O cliente enviou: \"%s\"\n"+
			"Veículo de interesse: %s\n"+
			"Escreva uma resposta curta, profissional e persuasiva para WhatsApp (máximo 3 linhas). "+
			"Não use emojis em excesso. Responda apenas com o texto da mensagem.",
		storeName, leadMessage, vehicleTitle,
	)

	return s.complete(ctx, prompt)
}

// SummarizeLead generates a brief summary of a lead's history.
func (s *Service) SummarizeLead(ctx context.Context, name, activities string) (string, error) {
	prompt := fmt.Sprintf(
		"Resuma em 2 frases o histórico deste lead para um vendedor de veículos.\n"+
			"Nome: %s\nAtividades:\n%s\nResuma em português.",
		name, activities,
	)

	return s.complete(ctx, prompt)
}

// ─── Internal ─────────────────────────────────────────────────────────────────

type chatRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func (s *Service) complete(ctx context.Context, userPrompt string) (string, error) {
	if s.apiKey == "" {
		return "", fmt.Errorf("ai: OPENROUTER_API_KEY not configured")
	}

	body := chatRequest{
		Model: s.model,
		Messages: []chatMessage{
			{Role: "user", Content: userPrompt},
		},
	}

	b, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, openRouterURL, bytes.NewReader(b))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("HTTP-Referer", "https://revendaclick.com.br")
	req.Header.Set("X-Title", "RevendaClick")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var cr chatResponse
	if err := json.NewDecoder(resp.Body).Decode(&cr); err != nil {
		return "", err
	}
	if cr.Error != nil {
		return "", fmt.Errorf("ai: %s", cr.Error.Message)
	}
	if len(cr.Choices) == 0 {
		return "", fmt.Errorf("ai: empty response")
	}
	return strings.TrimSpace(cr.Choices[0].Message.Content), nil
}
