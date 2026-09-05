import React, { useEffect, useState, useRef, useCallback } from 'react';
import { analysisAPI } from '../services/api';

// Simple UUID generator for browser session
const generateUUID = () => {
  return 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
};

export const useCodeAnalysis = ({ code, language, problemId = null, problemTitle = null, problemTopic = null }) => {
  const [sessionId] = useState(() => generateUUID());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [keystrokes, setKeystrokes] = useState(0);
  const [analysisData, setAnalysisData] = useState({
    scores: {
      overall: 0,
      syntax: 0,
      quality: 0,
      problem_solving: 0,
      efficiency: 0,
      coding_level: 'Beginner',
    },
    mistakes: [],
    ai_tips: [],
    recommendations: [],
    analysis_summary: 'Start typing your code to activate real-time skill analysis...',
    is_empty: true,
  });

  const timerRef = useRef(null);
  const previousCodeRef = useRef('');

  // Record keystrokes
  const recordActivity = useCallback(() => {
    setKeystrokes((prev) => prev + 1);
  }, []);

  // Debounced API call for real-time analysis
  useEffect(() => {
    if (!code || code.trim().length < 5) {
      setAnalysisData((prev) => ({
        ...prev,
        is_empty: true,
        analysis_summary: 'Start typing code to begin live skill assessment...',
      }));
      return;
    }

    // Skip redundant triggers if code hasn't changed
    if (code === previousCodeRef.current) return;
    previousCodeRef.current = code;

    // Clear previous debounce timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsAnalyzing(true);

    // 1.5s debounce delay as specified
    timerRef.current = setTimeout(async () => {
      try {
        const response = await analysisAPI.analyzeCode({
          session_id: sessionId,
          code,
          language,
          problem_id: problemId,
          problem_title: problemTitle,
          problem_topic: problemTopic,
          keystrokes: keystrokes,
        });

        if (response.data) {
          setAnalysisData(response.data);
        }
      } catch (err) {
        console.warn('Real-time analysis error (non-fatal):', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [code, language, problemId, problemTitle, problemTopic, sessionId, keystrokes]);

  return {
    sessionId,
    isAnalyzing,
    analysisData,
    recordActivity,
    scores: analysisData.scores || {},
    mistakes: analysisData.mistakes || [],
    aiTips: analysisData.ai_tips || [],
    recommendations: analysisData.recommendations || [],
    summary: analysisData.analysis_summary || '',
  };
};

export default useCodeAnalysis;
