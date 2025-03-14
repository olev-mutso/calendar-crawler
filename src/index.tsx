import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container!);
  
const App: React.FC<{}> = ({ }) => {

  return (<>empty index</>);
}


root.render(<App />);
