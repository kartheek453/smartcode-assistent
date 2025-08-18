import { useState, useEffect } from 'react';
import { Box, Container, Select, MenuItem, Button, Typography, Paper, ThemeProvider, createTheme, CssBaseline, IconButton, ToggleButton, ToggleButtonGroup, Divider } from '@mui/material';
import { Resizable } from 're-resizable';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Editor from '@monaco-editor/react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2d2d2d',
    },
  },
});



const languages = [
  { id: 'python', name: 'Python' },
  { id: 'cpp', name: 'C++' },
  { id: 'c', name: 'C' },
  { id: 'java', name: 'Java' },
  { id: 'r', name: 'R' }
];

const defaultCode = {
  python: '// Write your Python code here\nprint("Hello World!")',
  cpp: '// Write your C++ code here\n#include <iostream>\nint main() {\n    std::cout << "Hello World!" << std::endl;\n    return 0;\n}',
  c: '// Write your C code here\n#include <stdio.h>\nint main() {\n    printf("Hello World!\n");\n    return 0;\n}',
  java: '// Write your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}',
  r: '# Write your R code here\nprint("Hello World!")',
};

function App() {
  const handleCloseWelcomeDialog = (showExplanation) => {
    // Clear any existing output and close dialog immediately
    setOutput('');
    setShowWelcomeDialog(false);
    localStorage.setItem('isFirstVisit', 'false');
    
    if (showExplanation) {
      // Add a small delay to ensure dialog is closed before showing the explanation
      setTimeout(() => {
        setOutput(`Welcome to the Online Code Editor! Here's what you can do:

1. Choose Programming Language:
   - Select from Python, C++, C, Java, or R
   - Each language comes with a starter template

2. Code Editor Features:
   - Syntax highlighting
   - Auto-completion
   - Line numbers
   - Dark/Light theme toggle

3. Layout Options:
   - Toggle between vertical and horizontal split views
   - Resize editor and output panels

4. Code Analysis:
   - Run code to get AI-powered analysis
   - Get suggestions for improvements
   - Identify potential issues

5. Additional Tools:
   - Download your code
   - Copy output results
   - Auto-save feature

Start coding now and explore all these features!`);
      }, 100); // Small delay to ensure smooth transition
    }
  };

  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(() => {
    return localStorage.getItem('isFirstVisit') !== 'false';
  });
  const [code, setCode] = useState(() => {
    const savedCode = localStorage.getItem(`code_${selectedLanguage}`);
    return savedCode || defaultCode[selectedLanguage];
  });
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [outputPosition, setOutputPosition] = useState('bottom');

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
    const savedCode = localStorage.getItem(`code_${newLanguage}`);
    setCode(savedCode || defaultCode[newLanguage]);
  };

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${selectedLanguage}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Autosave code
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      localStorage.setItem(`code_${selectedLanguage}`, code);
    }, 1000);
    return () => clearTimeout(saveTimeout);
  }, [code, selectedLanguage]);

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const analyzeCode = async (code, error) => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      // console.log(import.meta.env.VITE_GEMINI_API_KEY);

      if (!apiKey) {
        throw new Error('Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.');
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const prompt = error
        ? `Provide a simple error explanation for this code. Only focus on the error, no extra information.
If it's a syntax error, start with ❗, if it's a runtime error, start with ⚠️.
Explain what's wrong and how to fix it in 1-2 sentences.

Code:
${code}

Error: ${error}`
        : `Review this code and provide VSCode-style feedback in the following format:

error type 
cause of error 

Code:
${code}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      if (err.message.includes('API key') || err.message.includes('Gemini API key')) {
        return err.message;
      } else if (err.message.includes('network')) {
        return 'Error: Network connection issue. Please check your internet connection.';
      } else if (err.message.includes('permissions') || err.message.includes('quota')) {
        return 'Error: API key permissions or quota exceeded. Please check your API key settings.';
      }
      return `Error analyzing code: ${err.message}. Please try again.`;
    }
  };

  const handleRunCode = async () => {
    setIsLoading(true);
    setOutput('Running code...');

    try {
      // For demonstration, we'll just analyze the code
      // In a real implementation, you would send the code to a backend for execution
      const analysis = await analyzeCode(code);
      setOutput(analysis);
    } catch (error) {
      const errorAnalysis = await analyzeCode(code, error.message);
      setOutput(`Error: ${errorAnalysis}`);
    } finally {
      setIsLoading(false);
    }
  };

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Dialog
        open={showWelcomeDialog}
        onClose={() => handleCloseWelcomeDialog(false)}
        aria-labelledby="welcome-dialog-title"
        aria-describedby="welcome-dialog-description"
      >
        <DialogTitle id="welcome-dialog-title">
          Welcome to Online Code Editor
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="welcome-dialog-description">
            Are you new to this platform? Would you like to see an explanation of its features?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseWelcomeDialog(false)} color="primary">
            No, I'm Familiar
          </Button>
          <Button onClick={() => handleCloseWelcomeDialog(true)} color="primary" variant="contained">
            Yes, Show Me
          </Button>
        </DialogActions>
      </Dialog>
      <Container maxWidth={false} disableGutters sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        p: 0,
        m: 0,
        width: '100vw'
      }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, p: 2, backgroundColor: 'background.paper' }}>
        <Typography variant="h4" gutterBottom>
          Online Code Editor
        </Typography>
        <Select
          value={selectedLanguage}
          onChange={handleLanguageChange}
          sx={{ 
            minWidth: 200,
            backgroundColor: 'background.paper',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.23)'
            }
          }}
        >
          {languages.map((lang) => (
            <MenuItem key={lang.id} value={lang.id}>
              {lang.name}
            </MenuItem>
          ))}
        </Select>
          <IconButton onClick={handleThemeToggle} color="inherit" sx={{ mr: 2 }}>
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <ToggleButtonGroup
            value={outputPosition}
            exclusive
            onChange={(e, newValue) => newValue && setOutputPosition(newValue)}
            size="small"
          >
            <ToggleButton value="right" aria-label="right aligned">
              <ViewWeekIcon />
            </ToggleButton>
            <ToggleButton value="bottom" aria-label="bottom aligned">
              <ViewStreamIcon />
            </ToggleButton>
          </ToggleButtonGroup>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          onClick={handleRunCode}
          disabled={isLoading}
          sx={{
            px: 4,
            py: 1,
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: 'primary.dark'
            }
          }}
        >
          {isLoading ? 'Running...' : 'Run Code'}
        </Button>
        <Button
          variant="outlined"
          onClick={handleDownloadCode}
          sx={{ px: 4, py: 1 }}
        >
          Download Code
        </Button>
      </Box>

      <Box sx={{
        display: 'flex',
        gap: 2,
        flexDirection: outputPosition === 'bottom' ? 'column' : 'row',
        flex: 1,
        width: '100%',
        position: 'relative',
        height: 'calc(100vh - 140px)',
        overflow: 'hidden'
      }}>
        <Resizable
          defaultSize={{
            width: '100%',
            height: '100%'
          }}
          size={{
            width: '100%',
            height: '100%'
          }}
          minWidth={outputPosition === 'bottom' ? '100%' : '30%'}
          maxWidth={outputPosition === 'bottom' ? '100%' : '70%'}
          minHeight={outputPosition === 'bottom' ? '30%' : '100%'}
          maxHeight={outputPosition === 'bottom' ? '70%' : '100%'}
          enable={{
            top: outputPosition === 'bottom',
            right: outputPosition === 'right',
            bottom: false,
            left: false,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false
          }}
          handleStyles={{
            right: {
              width: '8px',
              height: '100%',
              right: '-4px',
              backgroundColor: theme.palette.divider,
              cursor: 'col-resize',
              '&:hover': {
                backgroundColor: theme.palette.primary.main,
                opacity: 0.8,
                width: '10px',
                right: '-5px'
              },
              transition: 'all 0.2s ease'
            },
            top: {
              width: '100%',
              height: '8px',
              top: '-4px',
              backgroundColor: theme.palette.divider,
              cursor: 'row-resize',
              '&:hover': {
                backgroundColor: theme.palette.primary.main,
                opacity: 0.8,
                height: '10px',
                top: '-5px'
              },
              transition: 'all 0.2s ease'
            }
          }}
        >
          <Paper elevation={3} sx={{
            height: '100%',
            overflow: 'hidden',
            borderRadius: 1,
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column'
          }}>
          <Editor
            height="100%"
            language={selectedLanguage}
            value={code}
            onChange={handleEditorChange}
            theme={isDarkMode ? 'vs-dark' : 'vs-light'}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              automaticLayout: true,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              cursorStyle: 'line',
              wordWrap: 'on',
              suggestOnTriggerCharacters: true,
              snippetSuggestions: 'inline',
              folding: true,
              showFoldingControls: 'always',
              formatOnPaste: true,
              formatOnType: true,
              matchBrackets: 'always',
              renderLineHighlight: 'all',
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: true,
                verticalHasArrows: true,
                horizontalHasArrows: true
              }
            }}
          />
        </Paper>
        </Resizable>

        <Paper
          elevation={3}
          sx={{
            p: 2,
            backgroundColor: 'background.paper',
            flex: 1,
            overflow: 'auto',
            transition: 'all 0.3s ease',
            fontFamily: 'monospace',
            width: '100%',
            '& pre': {
              color: 'text.primary',
              fontSize: '14px',
              lineHeight: 1.5,
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            },
            '& .error-section': {
              color: theme.palette.error.main,
              fontWeight: 'bold',
              marginBottom: '8px'
            },
            '& .success-section': {
              color: theme.palette.success.main,
              fontWeight: 'bold',
              marginBottom: '8px'
            }
          }}
        >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">
            Output:
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleCopyOutput}
            startIcon={<ContentCopyIcon />}
          >
            Copy Output
          </Button>
        </Box>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
      </Paper>
      </Box>
    </Container>
    </ThemeProvider>
  );
}

export default App

