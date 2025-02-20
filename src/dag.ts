
/*
class vertex{
    constructor(name){
        this.name = name
		// (possibly not immediate) predecessor and successors
        this.pred = new Set();
        this.succ = new Set();
		// immediate predecessors and successors
        this.next = new Set();
        this.prev = new Set();
    }
}
export default vertex


*/

import _ from "lodash";
import flow_network from "./flow_network";



export class vertex{
	name:string;
	pred: Set<vertex>;
	succ: Set<vertex>;
	prev: Set<vertex>;
	next: Set<vertex>;
    constructor(name : string ){
        this.name = name
		// these are all vertex objects (not names)
		// (possibly not immediate) predecessor and successors
        this.pred= new Set();
        this.succ = new Set();
		// immediate predecessors and successors
        this.next = new Set();
        this.prev = new Set();
    }
}



export class dag{
	// vertices : list (not set) of strings
	// edges : list (not set) of pairs of strings
	vertices : Set<vertex>;
	verticesTable :  Record<string, vertex>; 
	constructor(vertices : string[], edges : [string, string][]){
		
		this.vertices = new Set(vertices.map(x => new vertex(x.toString())));
		this.verticesTable = {}

		for(var vertex_ of this.vertices){
			this.verticesTable[vertex_.name] = vertex_;
		}		
		for (var edge of edges){
			this.add_edge(edge[0].toString(), edge[1].toString());
		}
	}
	//string
	add_vertex(name : string) : void{ // cannot remove vertices
		var vertex_ = new vertex(name);
		this.vertices.add(vertex_);
		this.verticesTable[name] =vertex_;
	}
	get_vertices() : string[] {
		return Array.from(this.vertices).map((x) => x.name);
	}
	//strings
	add_edge(v1 : string, v2 : string) :  void{
		if(this.has_edge(v1, v2) || v1 == v2){
			return;
		}
		// no redundant edges
		if(Array.from(this.get_vertex_by_name(v1).succ).map((x) => x.name).indexOf(v2) != -1){
			return;
		}
		var v1obj = this.get_vertex_by_name(v1);
		var v2obj = this.get_vertex_by_name(v2);
		
		if(v2obj.succ.has(v1obj)){
			throw new Error("this edge will create a cycle")
		}
		
		v1obj.next.add(v2obj)
		v2obj.prev.add(v1obj)
		v1obj.succ.add(v2obj)
		v2obj.pred.add(v1obj)
		// every successor of v2 is also a successor of v1 now
		for(var vertex of v1obj.pred){
			vertex.succ.add(v2obj)
			vertex.succ = vertex.succ.union( v2obj.succ);
		}
		for(var vertex of v2obj.succ){
			vertex.pred.add(v1obj)
			vertex.pred = vertex.pred.union(v1obj.pred)
		}
		v1obj.succ = v1obj.succ.union(v2obj.succ)
		v2obj.pred = v1obj.pred.union(v2obj.pred)
	} // CANNOT remove edges!!!
	
	
	get_vertex_by_name(name : string) : vertex{
		return this.verticesTable[name];
	}
	// returns a list of vertices that are not in the list but all pre-requisites are in the list
	get_exposed_vertices(set_ : Set<string>){
		var exposed : Set<string> = new Set();
		for(var vertex of this.vertices){
			if(set_.has(vertex.name)){
				continue;
			}
			var valid = true;
			for(var prev of vertex.prev){
				if(!set_.has(prev.name)){
					valid = false;
					break;
				}
			}
			if(valid){
				exposed.add(vertex.name);
			}
		}
		return exposed;
	}
	// strings
	has_edge(v1 : string, v2 : string){ // v1 -> v2 is an edge
		return this.get_vertex_by_name(v1).next.has(this.get_vertex_by_name(v2))
	}
	// list of strings
	subgraph(vertices : string[]){
		var vertex_set = vertices;
		var edge_set : [string, string][]  = [];
		for(var x of vertices){
			for(var y of vertices){
				if(this.has_edge(x,y)){
					edge_set.push([x,y])
				}
			}
		}
		return new dag(vertex_set, edge_set);
	}
	// list of strings
	subgraph_without(vertices : string[]){
		var vertex_set : string[] = [];
		for(var vertex of this.vertices){
			if(vertices.indexOf(vertex.name) ==-1){
				vertex_set.push(vertex.name);
			}
		}
		return this.subgraph(vertex_set);
	}
	get_leaves(){
		var leaves = new Set<string>();
		for(var vertex of this.vertices){
			if(vertex.next.size == 0){
				leaves.add(vertex.name);
			}
		}
		return leaves;
	}

	join_on(other_dag : dag, this_vertex : string, other_vertex: string , mode : "union"|"edge"|"merge"= "merge") : void{
		// add all of the vertices from other dag
		
		// mode: edge : this edge has an edge to the other vertex
		// union : disjoint union of graphs
		// merge: this edge becomes the same as other_dag's vertex
		// add all of the vertices
		for(var vertex of other_dag.get_vertices()){
			if(this.verticesTable[vertex] != undefined){
				throw new Error("this graph and other graph has vertex with same name : " + vertex);
			}
			if(vertex==other_vertex && mode == "merge"){
				continue;
			}
			this.add_vertex(vertex);
		}
		// add all the edges
		for(var vertex of other_dag.get_vertices()){
			var source = vertex;
			if(vertex == other_vertex && mode == "merge"){
				source = this_vertex;
			}
			var their_edges = other_dag.get_vertex_by_name(vertex).next;
			for(var next_vertex of their_edges){
				this.add_edge(source, next_vertex.name);
			}
		}
		if(mode == "edge"){
			this.add_edge(this_vertex, other_vertex);
		}
	}

	// returns just the list of names
	toposort(){
		var prev  : Record<string, Set<string> >= {};
		var next : Record<string, Set<string> > = {};
		var frontier : Set<string> = new Set();
		var toposort_  : string[] = [];
		//initialize variables
		for(var vertex of this.vertices){
			prev[vertex.name] = new Set(Array.from(vertex.prev).map((x) => x.name))
			next[vertex.name] = new Set(Array.from(vertex.next).map((x) => x.name))
			if(prev[vertex.name].size == 0){
				frontier.add(vertex.name)
			}
		}
		//main loop
		while(frontier.size != 0){
			var vertex_ = Array.from(frontier)[0];
			frontier.delete(vertex_);
			toposort_.push(vertex_)
			for (var vertex2 of next[vertex_]){
				prev[vertex2].delete(vertex_);
				if(prev[vertex2].size == 0){
					frontier.add(vertex2);
				}
			}
		}
		return toposort_;
	}
	// to be used here:
	//https://codepen.io/mauriciom/pen/ZbXmYb
	// or a.html, that works too
	output(){
		var sort = this.toposort();
		var preamble = 
		`		
		
		<html>
 <head>
  <script type="text/javascript">
   window.onload = function() {
   
   var cy = cytoscape({
  container: document.getElementById('canvas'),
  
  style: [
    {
        selector: 'node',
        style: {
            label: 'data(id)'
        }
    }, {
		selector:"edge",
		style:{
		"curve-style":"straight",
			"mid-target-arrow-color":"red",
			"mid-target-arrow-shape":"triangle",
			"target-arrow-color":"red",
			"target-arrow-shape":"triangle"			
		}
	
	}]
	
});

var eles = cy.add([
`			
			var mid = "";
			var i=0;
			for(var v of  sort){
				i += 1600 / (this.vertices.size+1)
				mid += `{ group: 'nodes', data: { id: '${v}' }, position: { x: ${i}, y: ${Math.random() * 650 + 100} } },
				`;
			}
			for(var v2 of  this.vertices){
				for(var w of v2.next){
					mid += ` { group: 'edges', data: { id: '${v2.name + " " + w.name}', source: '${v2.name}', target: '${w.name}' } },
					`;
				}
			}

		var postamble = `]);


cy.resize();

cy.mount()
   };
  </script>
  
  <style>
    #canvas {
        width: 1600;
        height: 750;
        position: absolute;
        top: 0px;
        left: 0px;
    }
</style>


 </head>
 
 <body>
  <div id="canvas"></div>
   <div>
        </div>
	
			<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.15.2/cytoscape.min.js"></script>
			
			
			<script type="text/javascript" src="a.js"></script>
 </body>
</html>



`
		return preamble + mid + postamble;
	}
	toJSON(){
		var adjList : Record<string, string[]> = {};
		for(var vertex of this.vertices){
			adjList[vertex.name] = [];
			for(var next of vertex.next){
				adjList[vertex.name].push(next.name);
			}
		}
		return {
				"vertices" : Array.from(this.vertices).map((x) => x.name),
				"adjacency list": adjList,
			}
		
	}
	width(){
		// generate flow network from this dag
		if(this.verticesTable["s"] !== undefined || this.verticesTable["t"] !== undefined){
			throw "dag already has s and t!"
		} 
		var v = [...this.vertices];
		var vertices = ["s", "t"].concat(v.map((x) => x.name + " left")).concat(v.map((x) => x.name + " right"));
		var edges : Record<string, number> = {};
		for(var item of this.vertices){
			edges["s_" + item.name + " left"] = 1;
			edges[item.name + " right" + "_t"] = 1;
			for(var v2 of item.succ){
				edges[item.name + " left_" + v2.name + " right"] = v.length + 1;
			}
		}
		var result =  new flow_network(vertices, edges).ford_fulkerson("s", "t")
		// size is number of vertices - result[0]
		
		// to find the largest antichain, take the complement of the vertex cover. The vertex cover can be found from the cut set  (can't reach left, can reach right)
		// vertices not in vertex cover : can reach left and can't reach right
		var antichain = new Set([...this.vertices].map((x) => x.name).filter((x) => result[2].has(x + " left") && !result[2].has(x + " right")));
		return [this.vertices.size - result[0],antichain];

	}
}
