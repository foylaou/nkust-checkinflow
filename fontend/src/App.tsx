
import './App.css'
import {useState} from "react";

function App() {
    const [count, setCount] = useState(0);

  return (
    <>
    <button className="btn btn-primary" onClick={()=>setCount(count+1)}>this is button click num +1</button>
        <button className="btn btn-secondary" onClick={()=>setCount(0)}>reset</button>
        <p>{count}</p>
    </>
  )
}

export default App
