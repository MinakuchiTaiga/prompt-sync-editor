import { useState, useEffect } from 'react';
import type { LLMProvider, Highlight } from './types';
import { useApiKeys } from './hooks/useApiKeys';
import { useUserSettings } from './hooks/useUserSettings';
import { useHistory } from './hooks/useHistory';
import { translateText } from './services/translationService';
import { fetchTokenCount } from './services/tokenService';
import { findDifferences } from './utils/diffUtils';
import { Header } from './components/Header';
import { EditorPane } from './components/EditorPane';
import { ErrorToast } from './components/ErrorToast';
import { SettingsModal } from './components/modals/SettingsModal';
import { UserSettingsModal } from './components/modals/UserSettingsModal';
import { HowToUseModal } from './components/modals/HowToUseModal';

const App = () => {
  // Custom hooks
  const { apiKeys, setApiKeys, saveApiKeys, saveToLocalStorage, setSaveToLocalStorage } = useApiKeys();
  const { userSettings, setUserSettings, saveUserSettings } = useUserSettings();
  const { saveToHistory, undo, redo, clear: clearHistory, canUndo, canRedo } = useHistory();

  // LLM Provider selection
  const [llmProvider, setLlmProvider] = useState<LLMProvider>(() => {
    const saved = localStorage.getItem('llm_provider');
    return (saved as LLMProvider) || 'gemini';
  });

  // Modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [showApiKeyTooltip, setShowApiKeyTooltip] = useState(false);

  // Editor states
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [prevLeftText, setPrevLeftText] = useState("");
  const [prevRightText, setPrevRightText] = useState("");

  // Highlight states
  const [leftHighlights, setLeftHighlights] = useState<Highlight[]>([]);
  const [rightHighlights, setRightHighlights] = useState<Highlight[]>([]);

  // Token counts
  const [leftTokenCount, setLeftTokenCount] = useState(0);
  const [rightTokenCount, setRightTokenCount] = useState(0);

  // UI states
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastEdited, setLastEdited] = useState<'left' | 'right' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced text
  const [debouncedLeft, setDebouncedLeft] = useState(leftText);
  const [debouncedRight, setDebouncedRight] = useState(rightText);

  // Show API key tooltip if no keys are set
  useEffect(() => {
    if (!apiKeys.gemini && !apiKeys.openai && !apiKeys.claude) {
      setShowApiKeyTooltip(true);
    }
  }, [apiKeys]);

  // Debounce left text
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLeft(leftText), userSettings.translationDelay);
    return () => clearTimeout(timer);
  }, [leftText, userSettings.translationDelay]);

  // Debounce right text
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedRight(rightText), userSettings.translationDelay);
    return () => clearTimeout(timer);
  }, [rightText, userSettings.translationDelay]);

  // Apply highlights with animation
  const applyHighlights = (
    side: 'left' | 'right',
    oldText: string,
    newText: string,
    duration = 500
  ) => {
    const highlights: Highlight[] = [];

    if (newText.length > oldText.length || newText !== oldText) {
      let startPos = 0;
      while (startPos < Math.min(oldText.length, newText.length) && 
             oldText[startPos] === newText[startPos]) {
        startPos++;
      }

      let endPosOld = oldText.length - 1;
      let endPosNew = newText.length - 1;
      while (endPosOld >= startPos && endPosNew >= startPos && 
             oldText[endPosOld] === newText[endPosNew]) {
        endPosOld--;
        endPosNew--;
      }

      if (endPosNew >= startPos) {
        highlights.push({
          start: startPos,
          end: endPosNew + 1,
          type: 'added'
        });
      }
    }

    if (side === 'left') {
      setLeftHighlights(highlights);
      setTimeout(() => setLeftHighlights([]), duration);
    } else {
      setRightHighlights(highlights);
      setTimeout(() => setRightHighlights([]), duration);
    }
  };

  // Apply deletion highlights
  const applyDeletionHighlights = (
    side: 'left' | 'right',
    text: string,
    startLine: number,
    endLine: number,
    duration = 1000
  ) => {
    const lines = text.split('\n');
    let charStart = 0;
    
    for (let i = 0; i < startLine; i++) {
      charStart += lines[i].length + 1;
    }
    
    let charEnd = charStart;
    for (let i = startLine; i <= endLine && i < lines.length; i++) {
      charEnd += lines[i].length;
      if (i < endLine) charEnd += 1;
    }
    
    const highlights: Highlight[] = [{
      start: charStart,
      end: charEnd,
      type: 'removed'
    }];
    
    if (side === 'left') {
      setLeftHighlights(highlights);
      setTimeout(() => setLeftHighlights([]), duration);
    } else {
      setRightHighlights(highlights);
      setTimeout(() => setRightHighlights([]), duration);
    }
  };

  // Translation handler for left side (Japanese -> English)
  useEffect(() => {
    fetchTokenCount(debouncedLeft, llmProvider, apiKeys).then(setLeftTokenCount);

    if (lastEdited === 'left' && userSettings.autoTranslate) {
      const performTranslation = async () => {
        const diff = findDifferences(prevLeftText, debouncedLeft);
        
        setIsTranslating(true);
        try {
          if (!prevLeftText) {
            const translated = await translateText(debouncedLeft, "Japanese", "English", llmProvider, apiKeys);
            if (translated !== undefined) {
              applyHighlights('right', prevRightText, translated);
              setRightText(translated);
              setPrevLeftText(debouncedLeft);
              setPrevRightText(translated);
              const tokens = await fetchTokenCount(translated, llmProvider, apiKeys);
              saveToHistory(debouncedLeft, translated, leftTokenCount, tokens);
            }
          } else if (diff && diff.changedText.trim() && debouncedLeft.length >= prevLeftText.length) {
            const translatedDiff = await translateText(diff.changedText, "Japanese", "English", llmProvider, apiKeys);
            if (translatedDiff !== undefined) {
              const rightLines = prevRightText.split('\n');
              const translatedLines = translatedDiff.split('\n');
              
              const newRightLines = [
                ...rightLines.slice(0, diff.start),
                ...translatedLines,
                ...rightLines.slice(diff.oldEnd + 1)
              ];
              
              const newRightText = newRightLines.join('\n');
              applyHighlights('right', prevRightText, newRightText);
              setRightText(newRightText);
              setPrevLeftText(debouncedLeft);
              setPrevRightText(newRightText);
              
              const tokens = await fetchTokenCount(newRightText, llmProvider, apiKeys);
              saveToHistory(debouncedLeft, newRightText, leftTokenCount, tokens);
            }
          } else if (diff && debouncedLeft.length < prevLeftText.length) {
            const newLines = debouncedLeft.split('\n');
            const oldLines = prevLeftText.split('\n');
            
            const linesCompletelyRemoved = diff.oldEnd >= diff.start && 
                                           (diff.end < diff.start || 
                                            (diff.end === 0 && diff.start === 0 && newLines.length < oldLines.length));
            
            if (linesCompletelyRemoved && newLines.length < oldLines.length) {
              applyDeletionHighlights('right', prevRightText, diff.start, diff.oldEnd, 1000);
              
              setTimeout(() => {
                const rightLines = prevRightText.split('\n');
                const newRightLines = [
                  ...rightLines.slice(0, diff.start),
                  ...rightLines.slice(diff.oldEnd + 1)
                ];
                
                const newRightText = newRightLines.join('\n');
                setRightText(newRightText);
                setPrevLeftText(debouncedLeft);
                setPrevRightText(newRightText);
                
                fetchTokenCount(newRightText, llmProvider, apiKeys).then(tokens => {
                  saveToHistory(debouncedLeft, newRightText, leftTokenCount, tokens);
                });
              }, 1000);
            } else {
              const modifiedLines = newLines.slice(diff.start, Math.max(diff.start + 1, diff.end + 1));
              const modifiedText = modifiedLines.join('\n');
              
              if (modifiedText.trim()) {
                const translatedDiff = await translateText(modifiedText, "Japanese", "English", llmProvider, apiKeys);
                if (translatedDiff !== undefined) {
                  const rightLines = prevRightText.split('\n');
                  const translatedLines = translatedDiff.split('\n');
                  
                  const newRightLines = [
                    ...rightLines.slice(0, diff.start),
                    ...translatedLines,
                    ...rightLines.slice(diff.start + modifiedLines.length)
                  ];
                  
                  const newRightText = newRightLines.join('\n');
                  applyHighlights('right', prevRightText, newRightText);
                  setRightText(newRightText);
                  setPrevLeftText(debouncedLeft);
                  setPrevRightText(newRightText);
                  
                  const tokens = await fetchTokenCount(newRightText, llmProvider, apiKeys);
                  saveToHistory(debouncedLeft, newRightText, leftTokenCount, tokens);
                }
              }
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Translation failed');
        } finally {
          setIsTranslating(false);
        }
      };
      performTranslation();
    } else if (!debouncedLeft) {
      setLeftTokenCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedLeft, llmProvider]);

  // Translation handler for right side (English -> Japanese)
  useEffect(() => {
    fetchTokenCount(debouncedRight, llmProvider, apiKeys).then(setRightTokenCount);

    if (lastEdited === 'right' && userSettings.autoTranslate) {
      const performTranslation = async () => {
        const diff = findDifferences(prevRightText, debouncedRight);
        
        setIsTranslating(true);
        try {
          if (!prevRightText) {
            const translated = await translateText(debouncedRight, "English", "Japanese", llmProvider, apiKeys);
            if (translated !== undefined) {
              applyHighlights('left', prevLeftText, translated);
              setLeftText(translated);
              setPrevRightText(debouncedRight);
              setPrevLeftText(translated);
              const tokens = await fetchTokenCount(translated, llmProvider, apiKeys);
              saveToHistory(translated, debouncedRight, tokens, rightTokenCount);
            }
          } else if (diff && diff.changedText.trim() && debouncedRight.length >= prevRightText.length) {
            const translatedDiff = await translateText(diff.changedText, "English", "Japanese", llmProvider, apiKeys);
            if (translatedDiff !== undefined) {
              const leftLines = prevLeftText.split('\n');
              const translatedLines = translatedDiff.split('\n');
              
              const newLeftLines = [
                ...leftLines.slice(0, diff.start),
                ...translatedLines,
                ...leftLines.slice(diff.oldEnd + 1)
              ];
              
              const newLeftText = newLeftLines.join('\n');
              applyHighlights('left', prevLeftText, newLeftText);
              setLeftText(newLeftText);
              setPrevRightText(debouncedRight);
              setPrevLeftText(newLeftText);
              
              const tokens = await fetchTokenCount(newLeftText, llmProvider, apiKeys);
              saveToHistory(newLeftText, debouncedRight, tokens, rightTokenCount);
            }
          } else if (diff && debouncedRight.length < prevRightText.length) {
            const newLines = debouncedRight.split('\n');
            const oldLines = prevRightText.split('\n');
            
            const linesCompletelyRemoved = diff.oldEnd >= diff.start && 
                                           (diff.end < diff.start || 
                                            (diff.end === 0 && diff.start === 0 && newLines.length < oldLines.length));
            
            if (linesCompletelyRemoved && newLines.length < oldLines.length) {
              applyDeletionHighlights('left', prevLeftText, diff.start, diff.oldEnd, 1000);
              
              setTimeout(() => {
                const leftLines = prevLeftText.split('\n');
                const newLeftLines = [
                  ...leftLines.slice(0, diff.start),
                  ...leftLines.slice(diff.oldEnd + 1)
                ];
                
                const newLeftText = newLeftLines.join('\n');
                setLeftText(newLeftText);
                setPrevRightText(debouncedRight);
                setPrevLeftText(newLeftText);
                
                fetchTokenCount(newLeftText, llmProvider, apiKeys).then(tokens => {
                  saveToHistory(newLeftText, debouncedRight, tokens, rightTokenCount);
                });
              }, 1000);
            } else {
              const modifiedLines = newLines.slice(diff.start, Math.max(diff.start + 1, diff.end + 1));
              const modifiedText = modifiedLines.join('\n');
              
              if (modifiedText.trim()) {
                const translatedDiff = await translateText(modifiedText, "English", "Japanese", llmProvider, apiKeys);
                if (translatedDiff !== undefined) {
                  const leftLines = prevLeftText.split('\n');
                  const translatedLines = translatedDiff.split('\n');
                  
                  const newLeftLines = [
                    ...leftLines.slice(0, diff.start),
                    ...translatedLines,
                    ...leftLines.slice(diff.start + modifiedLines.length)
                  ];
                  
                  const newLeftText = newLeftLines.join('\n');
                  applyHighlights('left', prevLeftText, newLeftText);
                  setLeftText(newLeftText);
                  setPrevRightText(debouncedRight);
                  setPrevLeftText(newLeftText);
                  
                  const tokens = await fetchTokenCount(newLeftText, llmProvider, apiKeys);
                  saveToHistory(newLeftText, debouncedRight, tokens, rightTokenCount);
                }
              }
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Translation failed');
        } finally {
          setIsTranslating(false);
        }
      };
      performTranslation();
    } else if (!debouncedRight) {
      setRightTokenCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedRight, llmProvider]);

  // Manual translation handlers
  const handleManualTranslateLeft = async () => {
    const apiKey = apiKeys[llmProvider];
    if (!leftText || !apiKey) return;
    
    const diff = findDifferences(prevLeftText, leftText);
    
    setIsTranslating(true);
    try {
      if (!prevLeftText) {
        const translated = await translateText(leftText, "Japanese", "English", llmProvider, apiKeys);
        if (translated !== undefined) {
          applyHighlights('right', prevRightText, translated);
          setRightText(translated);
          setPrevLeftText(leftText);
          setPrevRightText(translated);
          const tokens = await fetchTokenCount(translated, llmProvider, apiKeys);
          saveToHistory(leftText, translated, leftTokenCount, tokens);
        }
      } else if (diff && diff.changedText.trim() && leftText.length >= prevLeftText.length) {
        const translatedDiff = await translateText(diff.changedText, "Japanese", "English", llmProvider, apiKeys);
        if (translatedDiff !== undefined) {
          const rightLines = prevRightText.split('\n');
          const translatedLines = translatedDiff.split('\n');
          
          const newRightLines = [
            ...rightLines.slice(0, diff.start),
            ...translatedLines,
            ...rightLines.slice(diff.oldEnd + 1)
          ];
          
          const newRightText = newRightLines.join('\n');
          applyHighlights('right', prevRightText, newRightText);
          setRightText(newRightText);
          setPrevLeftText(leftText);
          setPrevRightText(newRightText);
          
          const tokens = await fetchTokenCount(newRightText, llmProvider, apiKeys);
          saveToHistory(leftText, newRightText, leftTokenCount, tokens);
        }
      } else if (diff && leftText.length < prevLeftText.length) {
        const newLines = leftText.split('\n');
        const oldLines = prevLeftText.split('\n');
        
        const linesCompletelyRemoved = diff.oldEnd >= diff.start && 
                                       (diff.end < diff.start || 
                                        (diff.end === 0 && diff.start === 0 && newLines.length < oldLines.length));
        
        if (linesCompletelyRemoved && newLines.length < oldLines.length) {
          applyDeletionHighlights('right', prevRightText, diff.start, diff.oldEnd, 1000);
          
          setTimeout(() => {
            const rightLines = prevRightText.split('\n');
            const newRightLines = [
              ...rightLines.slice(0, diff.start),
              ...rightLines.slice(diff.oldEnd + 1)
            ];
            
            const newRightText = newRightLines.join('\n');
            setRightText(newRightText);
            setPrevLeftText(leftText);
            setPrevRightText(newRightText);
            
            fetchTokenCount(newRightText, llmProvider, apiKeys).then(tokens => {
              saveToHistory(leftText, newRightText, leftTokenCount, tokens);
            });
          }, 1000);
        } else {
          const modifiedLines = newLines.slice(diff.start, Math.max(diff.start + 1, diff.end + 1));
          const modifiedText = modifiedLines.join('\n');
          
          if (modifiedText.trim()) {
            const translatedDiff = await translateText(modifiedText, "Japanese", "English", llmProvider, apiKeys);
            if (translatedDiff !== undefined) {
              const rightLines = prevRightText.split('\n');
              const translatedLines = translatedDiff.split('\n');
              
              const newRightLines = [
                ...rightLines.slice(0, diff.start),
                ...translatedLines,
                ...rightLines.slice(diff.start + modifiedLines.length)
              ];
              
              const newRightText = newRightLines.join('\n');
              applyHighlights('right', prevRightText, newRightText);
              setRightText(newRightText);
              setPrevLeftText(leftText);
              setPrevRightText(newRightText);
              
              const tokens = await fetchTokenCount(newRightText, llmProvider, apiKeys);
              saveToHistory(leftText, newRightText, leftTokenCount, tokens);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleManualTranslateRight = async () => {
    const apiKey = apiKeys[llmProvider];
    if (!rightText || !apiKey) return;
    
    const diff = findDifferences(prevRightText, rightText);
    
    setIsTranslating(true);
    try {
      if (!prevRightText) {
        const translated = await translateText(rightText, "English", "Japanese", llmProvider, apiKeys);
        if (translated !== undefined) {
          applyHighlights('left', prevLeftText, translated);
          setLeftText(translated);
          setPrevRightText(rightText);
          setPrevLeftText(translated);
          const tokens = await fetchTokenCount(translated, llmProvider, apiKeys);
          saveToHistory(translated, rightText, tokens, rightTokenCount);
        }
      } else if (diff && diff.changedText.trim() && rightText.length >= prevRightText.length) {
        const translatedDiff = await translateText(diff.changedText, "English", "Japanese", llmProvider, apiKeys);
        if (translatedDiff !== undefined) {
          const leftLines = prevLeftText.split('\n');
          const translatedLines = translatedDiff.split('\n');
          
          const newLeftLines = [
            ...leftLines.slice(0, diff.start),
            ...translatedLines,
            ...leftLines.slice(diff.oldEnd + 1)
          ];
          
          const newLeftText = newLeftLines.join('\n');
          applyHighlights('left', prevLeftText, newLeftText);
          setLeftText(newLeftText);
          setPrevRightText(rightText);
          setPrevLeftText(newLeftText);
          
          const tokens = await fetchTokenCount(newLeftText, llmProvider, apiKeys);
          saveToHistory(newLeftText, rightText, tokens, rightTokenCount);
        }
      } else if (diff && rightText.length < prevRightText.length) {
        const newLines = rightText.split('\n');
        const oldLines = prevRightText.split('\n');
        
        const linesCompletelyRemoved = diff.oldEnd >= diff.start && 
                                       (diff.end < diff.start || 
                                        (diff.end === 0 && diff.start === 0 && newLines.length < oldLines.length));
        
        if (linesCompletelyRemoved && newLines.length < oldLines.length) {
          applyDeletionHighlights('left', prevLeftText, diff.start, diff.oldEnd, 1000);
          
          setTimeout(() => {
            const leftLines = prevLeftText.split('\n');
            const newLeftLines = [
              ...leftLines.slice(0, diff.start),
              ...leftLines.slice(diff.oldEnd + 1)
            ];
            
            const newLeftText = newLeftLines.join('\n');
            setLeftText(newLeftText);
            setPrevRightText(rightText);
            setPrevLeftText(newLeftText);
            
            fetchTokenCount(newLeftText, llmProvider, apiKeys).then(tokens => {
              saveToHistory(newLeftText, rightText, tokens, rightTokenCount);
            });
          }, 1000);
        } else {
          const modifiedLines = newLines.slice(diff.start, Math.max(diff.start + 1, diff.end + 1));
          const modifiedText = modifiedLines.join('\n');
          
          if (modifiedText.trim()) {
            const translatedDiff = await translateText(modifiedText, "English", "Japanese", llmProvider, apiKeys);
            if (translatedDiff !== undefined) {
              const leftLines = prevLeftText.split('\n');
              const translatedLines = translatedDiff.split('\n');
              
              const newLeftLines = [
                ...leftLines.slice(0, diff.start),
                ...translatedLines,
                ...leftLines.slice(diff.start + modifiedLines.length)
              ];
              
              const newLeftText = newLeftLines.join('\n');
              applyHighlights('left', prevLeftText, newLeftText);
              setLeftText(newLeftText);
              setPrevRightText(rightText);
              setPrevLeftText(newLeftText);
              
              const tokens = await fetchTokenCount(newLeftText, llmProvider, apiKeys);
              saveToHistory(newLeftText, rightText, tokens, rightTokenCount);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  // Event handlers
  const handleLeftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLeftText(e.target.value);
    setLastEdited('left');
  };

  const handleRightChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRightText(e.target.value);
    setLastEdited('right');
  };

  const handleClear = () => {
    setLeftText("");
    setRightText("");
    setPrevLeftText("");
    setPrevRightText("");
    setLeftTokenCount(0);
    setRightTokenCount(0);
    setLastEdited(null);
    clearHistory();
  };

  const handleUndo = () => {
    const state = undo();
    if (state) {
      setLeftText(state.leftText);
      setRightText(state.rightText);
      setPrevLeftText(state.leftText);
      setPrevRightText(state.rightText);
      setLeftTokenCount(state.leftTokenCount);
      setRightTokenCount(state.rightTokenCount);
      setLastEdited(null);
    }
  };

  const handleRedo = () => {
    const state = redo();
    if (state) {
      setLeftText(state.leftText);
      setRightText(state.rightText);
      setPrevLeftText(state.leftText);
      setPrevRightText(state.rightText);
      setLeftTokenCount(state.leftTokenCount);
      setRightTokenCount(state.rightTokenCount);
      setLastEdited(null);
    }
  };

  const handleSaveApiKeys = async () => {
    const success = await saveApiKeys(apiKeys);
    if (success) {
      localStorage.setItem('llm_provider', llmProvider);
      setShowApiKeyTooltip(false);
      setIsSettingsOpen(false);
    } else {
      setError('APIキーの保存に失敗しました');
    }
  };

  const handleSaveUserSettings = () => {
    saveUserSettings(userSettings);
    setIsUserSettingsOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      <Header
        isTranslating={isTranslating}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onOpenHowToUse={() => setIsHowToUseOpen(true)}
        onOpenUserSettings={() => setIsUserSettingsOpen(true)}
        onOpenSettings={() => {
          setShowApiKeyTooltip(false);
          setIsSettingsOpen(true);
        }}
        showApiKeyTooltip={showApiKeyTooltip}
        hasApiKey={!!apiKeys[llmProvider]}
      />

      <main className="flex-1 overflow-hidden relative bg-gradient-to-br from-blue-50/30 to-slate-50">
        <div className="h-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-blue-100">
          <EditorPane 
            title="Japanese (日本語)" 
            value={leftText} 
            onChange={handleLeftChange} 
            placeholder="ここに日本語のプロンプトを入力..."
            isTranslating={isTranslating && lastEdited === 'right'}
            tokenCount={leftTokenCount}
            langIcon={<span className="text-xs font-bold bg-blue-100 px-1.5 py-0.5 rounded text-blue-700">JP</span>}
            showManualTranslate={!userSettings.autoTranslate}
            onManualTranslate={handleManualTranslateLeft}
            highlights={leftHighlights}
          />

          <EditorPane 
            title="English" 
            value={rightText} 
            onChange={handleRightChange} 
            placeholder="English prompt will appear here, or type to translate back..."
            isTranslating={isTranslating && lastEdited === 'left'}
            tokenCount={rightTokenCount}
            langIcon={<span className="text-xs font-bold bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-700">EN</span>}
            showManualTranslate={!userSettings.autoTranslate}
            onManualTranslate={handleManualTranslateRight}
            highlights={rightHighlights}
          />
        </div>
      </main>

      <ErrorToast error={error} onClose={() => setError(null)} />

      <HowToUseModal 
        isOpen={isHowToUseOpen}
        onClose={() => setIsHowToUseOpen(false)}
      />

      <UserSettingsModal
        isOpen={isUserSettingsOpen}
        onClose={() => setIsUserSettingsOpen(false)}
        userSettings={userSettings}
        setUserSettings={setUserSettings}
        onSave={handleSaveUserSettings}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        llmProvider={llmProvider}
        setLlmProvider={setLlmProvider}
        apiKeys={apiKeys}
        setApiKeys={setApiKeys}
        saveToLocalStorage={saveToLocalStorage}
        setSaveToLocalStorage={setSaveToLocalStorage}
        onSave={handleSaveApiKeys}
      />
    </div>
  );
};

export default App;
