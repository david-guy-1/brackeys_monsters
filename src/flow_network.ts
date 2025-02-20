
class flow_network{
	vertices : Set<string>;
	capacity : Record<string, number>
	edges : Set<string>
	constructor(vertices : string[] , capacity : Record<string, number>){ // edge : vertex_vertex -> number
		this.vertices = new Set(vertices);
		this.capacity = capacity;
		this.edges = new Set(Object.keys(capacity));
        for(var edge of this.edges){
			var v1 = edge.split("_")[0];
			var v2 = edge.split("_")[1];
            if(this.vertices.has(v1) == false || this.vertices.has(v2) == false){
                throw "error : edge " + edge + " not in vertices";
            }
        }
	}
	residual_graph(flow : Record<string, number>){
		var res_edges :Record<string, number> = {}
		for(var edge of this.edges){
			var v1 = edge.split("_")[0];
			var v2 = edge.split("_")[1];
			if(flow[edge] > 0){
				// can go backwards
				res_edges[v2 + "_" + v1] = flow[edge]
			}
			if(flow[edge] < this.capacity[edge]){
				//can go forwards
				res_edges[edge] = this.capacity[edge] - flow[edge]
			}
		}
		return res_edges;
	}
	ford_fulkerson(s : string ,t : string) : [number, Record<string, number> , Set < string> ]{
        if(!this.vertices.has(s)  || !this.vertices.has(t)){
            throw "error : ford fulkerson with invalid vertices";
        }
		//start with the all zeroes flwo
		var flow : Record<string, number> = {}
		for(var edge of this.edges){
			flow[edge] = 0;
		}
		var total_flow = 0; 

		while(true){
			var res = this.residual_graph(flow);
			// find an augmenting path using bfs
			var frontier = new Set([s])
			var seen : Record<string, string | undefined> = {s : undefined}
			var min_amt = Infinity; 
			while(frontier.size > 0){
				// RESIDUAL graph bfs
				var new_frontier : Set<string>  = new Set();
				for(var vertex of frontier){
					for(var vertex2 of this.vertices){
						if(seen[vertex2] != undefined){
							continue;
						}
						var amt = res[vertex + "_" + vertex2]  == undefined ? 0 : res[vertex + "_" + vertex2] ;
						if(amt > 0){
							new_frontier.add(vertex2);
							seen[vertex2] = vertex; 
							if(amt < min_amt){
								min_amt = amt;
							}
						}
					}
				}
				frontier = new_frontier
			}
			// t has no predecessor  = no path in residual graph 
			if(seen[t] == undefined){
				return [total_flow, flow, new Set(Object.keys(seen))]
			}
			// update flow based on augmenting path
			total_flow += min_amt; 
			var curr : string = t;
			while(curr != s){
				var prev : string | undefined = seen[curr];
				if(prev == undefined){
					throw "no path from t back to s"; 
				}
				if(this.edges.has(prev + "_" + curr )){
					// forward edge 
					flow[prev + "_" + curr] += min_amt;
				} 
				if(this.edges.has(curr + "_" + prev )){
					// backward edge 
					flow[curr + "_" + prev] -= min_amt;
				}
				curr = prev;  
			}
		}
	}
	

}
export default flow_network;