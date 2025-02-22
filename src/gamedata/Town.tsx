import { JSX } from "react";
import { canvas_size } from "./constants";
import game from "./game";

function town({g, town, recall} : {g : game, town : string, recall : (data : any) => void} ){
    let exposed = g.graph.get_exposed_vertices(g.collected_dag);
    let inner = []
    if((exposed.union(g.collected_dag)).intersection(g.towns[town]).size == 0){
        inner.push("You cannot come to this town, it's currently closed. Complete tasks in other towns to gain access.");
    }
    else {
        for (let vertex of g.towns[town]){
            let can_do = exposed.has(vertex);
            let already_done = g.collected_dag.has(vertex);
            if(already_done){
                inner.push(<tr><td>already did</td></tr>);
                inner.push(<br />)
            } else{
                let prereqs : JSX.Element[] | string= [...g.graph.get_vertex_by_name(vertex).prev].map(x => x.name).map(x =>"base_items/items/"+ g.images[parseInt(x)]).map(x => <img src={x}/>);
                if(prereqs.length == 0){
                    prereqs = "None"
                }
                inner.push(<tr style={ {height:43}} key={vertex}><td style={{width:130}}>{`Task:${g.item_tasks[vertex]}`}</td><td>item:</td><td style={{width:60}}><img src={"base_items/items/"+g.images[parseInt(vertex)]}/></td><td>need: {prereqs}</td><td>{can_do ? <button onClick={() => recall(vertex)}>Start </button>: "Can't do yet"}</td></tr>);
            }
        }
    }

    return <><img src="images/bg6.png" style={{"position":"absolute", top:0, zIndex:-1,left:0}}/>
       <div style={{position:"absolute", top:20, left:50, width:canvas_size[0]+60, height:canvas_size[1]-80,border:"1px solid black", padding:10,fontSize:20}}><table><tbody>{inner}</tbody></table><br /><button onClick={() => recall("back")}>Back </button>
       </div> 
        </>
}

export default town;