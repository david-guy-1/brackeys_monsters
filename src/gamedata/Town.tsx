import game from "./game";

function town({g, town, recall} : {g : game, town : string, recall : (data : any) => void} ){
    let exposed = g.graph.get_exposed_vertices(g.collected_dag);
    let inner = []
    if(!exposed.has(town)){
        inner.push("Nope");
    }
    else {
        for (let vertex of g.towns[town]){
            let can_do = exposed.has(vertex);
            let already_done = g.collected_dag.has(vertex);
            if(already_done){
                inner.push("already did");
            } else if (can_do){
                inner.push("CANDOIT");
                inner.push(<button onClick={() => recall(vertex)}>Start </button>)
            }
        }
    }
    inner.push(<button onClick={() => recall("back")}>Back </button>)
    return <><img src="images/bg6.png" style={{"position":"absolute", top:0, zIndex:-1,left:0}}/>
        {inner}
        </>
}

export default town;