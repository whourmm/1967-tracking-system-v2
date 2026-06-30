package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
)

type apiResponse struct {
	Data  any     `json:"data"`
	Error *string `json:"error"`
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeData(w http.ResponseWriter, status int, data any) {
	writeJSON(w, status, apiResponse{Data: data})
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, apiResponse{Data: nil, Error: &msg})
}

func pathID(r *http.Request, name string) (int64, bool) {
	s := r.PathValue(name)
	id, err := strconv.ParseInt(s, 10, 64)
	return id, err == nil
}
