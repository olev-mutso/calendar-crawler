import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container!);
  
const App: React.FC<{}> = ({ }) => {

  return (<div>
  <div><a href="https://olev-mutso.github.io/calendar-crawler/calendar.json">calendar.json</a></div>
  <div><a href="https://github.com/olev-mutso/calendar-crawler/blob/main/src/calendar.ts">calendar.ts</a></div>
  <div><a href="https://github.com/olev-mutso/calendar-crawler/blob/main/src/calendar-types.ts">calendar-types.ts</a></div>
  </div>
  );
}


root.render(<App />);
