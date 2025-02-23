import { useState } from "react";
import { getMuted, setMuted } from "./Sound";

function MuteButton(props : any){
    let [mute, setMute] = useState(getMuted()); 
    return <img src={mute ? "mute2.png" : "mute.png"} style={{position:"absolute", top:props.y , left:props.x}} onClick={() => {setMuted(!mute); setMute(!mute);} }></img>
}

export default MuteButton;