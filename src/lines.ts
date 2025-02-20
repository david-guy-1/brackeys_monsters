
type point = [number, number];
type point3d = [number, number, number];


export function flatten<T>(lst : T[][]) : T[] {
	let x  : T[] = [];
	for(let item of lst){
		for(let item2 of item){
			x.push(item2);
		}
	}
	return x;
}
export function flatten_all<T>(lst :  (T | T[])[]) : T[]{
	let x : T[] = [];
	for(let item of lst){
		if(Array.isArray(item)){
			x = x.concat(flatten_all(item)); 
		}
		else {
			x.push(item);
		}
	}
	return x;
}



// consider a grid starting at top_left, where each cell has given width and height, and the specified number of cells per row. Returns the (x, y, index) (NOT row, col) of the clicked cell, or undefined otherwise 
export function cell_index(top_left : point, w : number, h : number, amt_per_row : number,  x : number , y : number ) : [number, number, number] | undefined{
	if(x < top_left[0] || y < top_left[1]){
		return undefined
	} // clicked outside
	let [p, q] = [Math.floor((x - top_left[0])/w) , Math.floor((y - top_left[1])/h)];
	if(p >= amt_per_row){
		return undefined;
	}
	return [p, q, q*amt_per_row + p]; 
}

// mutates
export function move_lst<T>(a : T[] , b : T[]) : T[]{
	for(let i=0; i < a.length; i++){
		if(b[i] != undefined){
			a[i] = b[i]
		}
	}
	return a;
}


// mutates
export function combine_obj(obj : Record<string,any>,obj2 : Record<string,any>){
	for(let item of Object.keys(obj2)){
		obj[item] = obj2[item];
	}
}

// these two are used when the values in the hash table are lists
export function add_obj<K extends string | number | symbol, V>(obj : Record<K,V[]>, k : K, v : V){
	if(obj[k] == undefined){
		obj[k] = [];
	}
	obj[k].push(v); 
}

export function concat_obj<K extends string | number | symbol, V>(obj : Record<K,V[]>, k : K, v : V[]){
	if(obj[k] == undefined){
		obj[k] = [];
	}
	obj[k] = obj[k].concat(v); 
}

export function noNaN(lst : any[]) {
    for (let f of lst) {
        if (typeof (f) == "number" && isNaN(f)) {
            throw "noNaN but is NaN";
        }
        if (Array.isArray(f)) {
            noNaN(f);
        }
    }
}

// 0 = end , 1 = start
export function lerp(start : number[], end : number[], t : number) : number[] {
	noNaN(arguments as any as any[][]);
	if(start.length != end.length){
		throw "lerp with different lengths"
	} 
	let out : number[] = [];
	for(let i=0; i<start.length; i++){
		out.push(start[i]*t + (1-t)*end[i]);
	}
	return out; 
}


// av + bw
export function lincomb(a : number, v : number[], b : number, w : number[] ) : number[]  {
	if(v.length != w.length){
		throw "lincomb with different lengths"
	} 	
	let x : number[] = [];
	for(let i=0; i<v.length; i++){
		x[i] = a * v[i] + b * w[i];
	}
	return x; 
}

export function num_diffs<T>(x : T[], y : T[]) : number{
	let s= 0;
	for(let i=0; i < Math.max(x.length, y.length); i++){
		if(x[i] != y[i]){
			s++;
		}
	}
	return s; 
}

// vector magnitude
export function len(v: number[] ) : number{
	noNaN(arguments as any as any[][]);
	let l = 0;
	for(let item of v){
		l += item*item;
	}
	return  Math.sqrt(l);
}

// start at v, end at w
export function moveTo(v: number[], w : number[], dist_ : number) : number[]{
	noNaN(arguments as any as any[][]);
	var lst: number[] = [];
	if(v.length != w.length){
		throw "moveTo with uneven lengths"; 
	}
	for(var i=0; i < v.length; i++){
		lst.push(w[i] - v[i]);
	}
	if(len(lst) < dist_){
		return JSON.parse(JSON.stringify(w)) as number[];
	} else {
		lst = normalize(lst, dist_);
		for(var i=0; i < v.length; i++){
			lst[i] += v[i];
		}		
		return lst
	}
}

export function dist(v : number[], w : number[]) : number {
	noNaN(arguments as any as any[][]);
	if(v.length != w.length){
		throw "move with uneven lengths"; 
	}
	let s = 0;
	for(let i=0; i < v.length; i++){
		s += Math.pow((w[i] - v[i]),2);
	}	
	return Math.sqrt(s);
}

export function cross(a : number[], b : number[]){
	if(a.length !== 3 || 3 !== b.length){
		throw "cross product not 3d"; 
	}
	noNaN(arguments as any as any[][]);
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function dot(a : number[],b : number[]){
	if(a.length != b.length){
		throw "dot with uneven lengths"; 
	}
	noNaN(arguments as any as any[][]);
	let s = 0; 
	for(let i=0; i<a.length; i++){
		s += a[i] * b[i];
	}
	return s; 
}

export function angle_between(v1 : number[],  v2 : number[]){
	return Math.acos(dot(normalize(v1, 1), normalize(v2, 1)))
}

export function rescale(source_start : number, source_end : number, dest_start : number, dest_end : number, value : number) : number{
	let source_length = source_end - source_start
	let dest_length = dest_end - dest_start
	if(source_length == 0 || dest_length == 0){
		throw "rescale with zero length"
	}
	let ratio = (value - source_start)/ source_length;
	return ratio*dest_length + dest_start
}


export function normalize(v : number[], amt : number=1) : number[]{
	noNaN(arguments as any as any[][]);

	let l =  len(v);
	if(l == 0 ){
		if(amt != 0){
			throw "normalizing a zero vector to nonzero length"
		} else {
			return JSON.parse(JSON.stringify(v));
		}
	}
	let out : number[] = [];
	for(let item of v){
		out.push(item /l * amt); 
	}
	return out; 
}


// x = left/right, y = up/down, z = forwards/backwards
// lat/long starts at right (1,0,0) and lat goes up (positive y), long goes forwards (positive z) 
export function latlong_to_xyz(lat : number, long : number){
	noNaN(arguments as any as any[][]);
	let r = Math.cos(lat);
	let y = Math.sin(lat);
	let x = Math.cos(long)*r;
	let z = Math.sin(long)*r;
	return [x,y,z]; 
}

// positive z is prime meridian, eastwards (left when facing positive z, with upwards as positive y and right as positive x ) is positive longitude 
export function xyz_to_latlong(x:number , y:number, z:number ){
	noNaN(arguments as any as any[][]);
	let r = Math.sqrt(x*x + y*y + z*z);
	let lat = Math.asin(y / r);
	let long =  Math.atan2(z, x) - Math.PI/2;
	return [lat, long];

}
export function move3d(x :number,y :number,z :number,lat :number,long :number, dist :number) : point3d{
	noNaN(arguments as any as any[][]);
	let [dx,dy,dz] = latlong_to_xyz(lat, long);
	return [x+dx*dist, y+dy*dist, z+dz*dist];
}

export function point_to_color(n : point3d) : string {
	return `rgb(${n[0]}, ${n[1]}, ${n[2]})`; 
}

export function number_to_hex(n : number) : string {
	noNaN(arguments as any as any[][]);
    if(n == 0){
        return "";
    }
    return number_to_hex(Math.floor(n/16)) + "0123456789abcdef"[n%16] 
}

function get_keys(s : Set<string>, obj : any){
	// mutates s
	if(Array.isArray(obj)){
		for(let item of obj){
			get_keys(s, item);
		}
	} else if (typeof(obj) == "object"){
		for(let item of Object.keys(obj)){
			s.add(item)
			get_keys(s, obj[item]); 
		}
	}
}


export function json_alphabetical(obj : any) : string{
	let keys = new Set<string>();
	get_keys(keys, obj);
	let keys_lst = [...keys]
	keys_lst.sort()
	return JSON.stringify(obj, keys_lst)

}

export function all_choices<T>(x : T[], amt : number) : T[][]{
	if(amt == 0 ){
		return [[]]; 
	}
	if(amt == x.length){
		return [[...x]];
	}
	else {
		let no_take = all_choices(x.slice(1), amt)
		let yes_take = all_choices(x.slice(1), amt-1);
		yes_take.forEach((y) => y.splice(0, 0, x[0]));
		return no_take.concat(yes_take); 
	}
}
export function all_combos<T>(x : T[][]) : T[][]{
	if(arguments.length != 1){ 
		throw "call all_combos with a single list please!";
	}


	let index : number[] = [];
	for(let i=0; i < x.length; i++){
		index.push(0);
		if(!Array.isArray(x[i])){
			throw "call all_combos with array of arrays, not " + x[i].toString(); 
		}
	}
	let carry : (x : number) => boolean =  function(i : number){
		if(index[i] >= x[i].length){
			index[i] -= x[i].length;
			if(i != 0){
				index[i-1]++;
				return carry(i-1); 
			} else {
				// stop iteration
				return true; 
			}
		}
		return false; 
	}
	let out : T[][] = []; 
	while(true){
		let new_element: T[] = [];
		for(let i=0; i < x.length; i++){
			new_element.push(x[i][index[i]]);	
		}
		out.push(new_element);
		index[index.length-1]++;
		if(carry(index.length-1) ){
			break; 
		}
	}
	return out; 
}

export function pointInsideRectangleWH(...args : (number | number[])[]){
    noNaN(arguments as any);
	let lst = flatten_all(args);
	if(lst.length != 6){
		throw "pointInsideRectangle must have 6 points";
	}
	let [px, py, tlx, tly, width, height]  = lst; 

	if(px < tlx || px > tlx+width || py < tly || py > tly+height){
		return false;
	}
	return true;
}

export function pointInsideRectangleBR(...args : (number | number[])[]){
    noNaN(arguments as any);
	let lst = flatten_all(args);
	if(lst.length != 6){
		throw "pointInsideRectangleBR must have 6 points";
	}
	let [px, py, tlx, tly, brx, bry]  = lst; 
	return pointInsideRectangleWH(px, py, tlx, tly, brx-tlx, bry-tly);
}

export function vector_angle(v1 : point, v2 : point){
	v1 = normalize(v1, 1) as point; 
	v2 = normalize(v2, 1) as point;
	return Math.acos(dot(v1, v2)); 
}

export function moveIntoRectangleWH(...args : (number | number[])[]){
    noNaN(arguments as any);
	let lst = flatten_all(args);
	if(lst.length != 6){
		throw "moveIntoRectangleWH must have 6 points";
	}
	let [px, py, tlx, tly, w, h]  = lst; 
	if(px < tlx){
		px = tlx;
	}
	if(px > tlx + w){
		px = tlx + w;
	}
	if(py < tly){
		py = tly;
	}
	if(py > tly+ h){
		py = tly + h;
	}
	return [px, py];
}

export function moveIntoRectangleBR(...args : (number | number[])[]){
    noNaN(arguments as any);
	let lst = flatten_all(args);
	if(lst.length != 6){
		throw "moveIntoRectangleWH must have 6 points";
	}
	let [px, py, tlx, tly, brx, bry]  = lst; 
	return moveIntoRectangleWH(px, py, tlx, tly, brx-tlx, bry-tly);
}



export function max(x : number[]){
	noNaN(arguments as any as any[][]);
    let m = -Infinity; 
    for(let i of x){
        if(i > m){
            m = i;
        }
    }
    return m; 
}

// line is given as 3 numbers [a,b,c], representing ax+by=c
export function getIntersection(line1:point3d , line2:point3d) : point{
	noNaN(arguments as any as any[][]);
	// lines are to be in the form of "ax + by = c", the lines are coefficients.
	let a = line1[0] , b = line1[1], c = line2[0], d = line2[1];
	let determinant = a*d-b*c;
	if (Math.abs(determinant) < 0.000001){
		throw "lines are too close to parallel";
	}
	// get the inverse matrix
	let ai = d/determinant, bi = -b/determinant, ci = -c/determinant, di = a/determinant;
	// now multiply
	return [ai * line1[2] + bi * line2[2], 	ci * line1[2] + di * line2[2]];
	
}
//given points (p1, p2), output the a,b,c coefficients that go through them
 export function pointToCoefficients(...args : (number | number[])[] ) : point3d{
	let lst = flatten_all(args);
	if(lst.length !=4){
		throw "pointToCoefficients must have 4 points";
	}
	let [p1x, p1y, p2x , p2y] = lst; 
	noNaN(arguments as any);
	if (p1x == p2x){ // vertical line
		return [1, 0, p1x]; // x = p1x
	}  else {
		let m = (p2y - p1y) / (p2x - p1x); // slope
		let b = p1y - m*p1x;
		// y = mx + b -> y - mx = b
		return [-m, 1, b];
	}
}

// [x, y] : point , [a,b,c] : line
export function pointClosestToLine(...args : (number | number[])[] ) : point3d{
	let lst = flatten_all(args);
	if(lst.length !=5){
		throw "pointClosestToLine must have 5 points";
	}
	noNaN(arguments as any);
	
	// want to minimize (x -p1)^2 + (y-p2)^2 subject to ax+by=c, use lagrange multipliers
	// L(x, y) = f(x,y) - \lambda g(x,y) - take partials and set them all to zero
	// (x - p1)^2 + (y - p2)^2 - \lambda (ax + by - c) 
	// dx = 2 (x-p1) - a \lambda
	// dy = 2 (y-p2) - b \lambda
	// d \lambda = ax + by - c
	// expand, we get the system of linear equations:
	// 2x - 2 p1 - a \lambda 
	// 2y - 2 p2 - b \lambda
	// ax + by - c
	// [2, 0, -a] 2p1
	// [0, 2, -b] 2p2
	// [a, b, 0] c
	// do Gaussian elimination : 
	// [2, 0, -a] 2p1
	// [a, b, 0] c
	// [0, 2, -b] 2p2
	// r1 / 2
	// [1, 0, -a/2] p1
	// [a, b, 0] c
	// [0, 2, -b] 2p2
	// r2 = r2 -a* r1 
	// [1, 0, -a/2] p1
	// [0, b, a^2/2] c - a*p1
	// [0, 2, -b] 2p2
	// r3 = r3 / 2
	// [1, 0, -a/2] p1
	// [0, b, a^2/2] c - a*p1
	// [0, 1, -b/2] p2
	
	// assume b != 0 , if b = 0, we have y = p2, lambda = (c - a *p1)/(a^2/2), and x = p1 - lambda * (-a/2) = c/a
	// otherwise: 

	// r3 = r3 -(1/b)* r2
	// [1, 0, -a/2] p1
	// [0, b, a^2/2] c - a*p1
	// [0, 0, -b/2 - a^2/(2b)] p2 - (c - a*p1)/b


	let [p1, p2,a,b,c] = lst; 
	if(b == 0){
		// line is of the form x = c/a
		return [c/a, p2, dist([p1, p2], [c/a, p2])]; 
	}
	let lambda = (p2 - (c - a*p1)/b)/ (-b/2 - a*a/(2*b));
	let y= ((c - a*p1) -  lambda * a*a/2)/b
	let x = p1 + a/2 * lambda
	return [x,y, dist([p1, p2], [x,y])];
}

export function pointClosestToSegment(...args : (number | number[])[] ) : point3d{
	let lst = flatten_all(args);
	if(lst.length !=6){
		throw "pointClosestToSegment must have 6 points";
	}
	noNaN(arguments as any);
	
	let [x, y, l1x, l1y, l2x, l2y] = lst;
	let closest_point = pointClosestToLine(x,y,pointToCoefficients(l1x, l1y, l2x, l2y)); 
	let between_ = false; 
	if(l1x == l2x) {
		// vertical line, test x value
		between_ = between(closest_point[0], l1x, l2x); 
	} else{
		// test y value
		between_ = between(closest_point[1], l1y, l2y); 
	}
	if(between_){
		return closest_point;
	} else {
		// check endpoints
		let d1 = dist([x,y], [l1x, l1y])
		let d2 = dist([x,y], [l2x, l2y])
		if(d1 < d2){
			return [l1x, l1y, d1];
		} else {
			return [l2x, l2y, d2];
		}
	}
}


 export function between(x:number ,b1:number , b2:number){ // returns if x is between b1 and b2  (inclusive:number)
    noNaN(arguments as any);
	if (b1 <= x && x <= b2){
		return true;
	}
	if (b1 >= x && x >= b2){
		return true;
	}
	return false
}
// lines are P = (p1x, p1y, p2x, p2y) and Q = (q1x, q1y, q2x, q2y)
// intersection must be between endpoints
 export function doLinesIntersect(...args : (number | number[])[] ){
	
	noNaN(arguments as any);
	let lst = flatten_all(args);
	if(lst.length !=8){
		throw "doLinesIntersect must have 8 points";
	}
	let [p1x, p1y, p2x, p2y, q1x, q1y, q2x, q2y] = lst; 
    
	let line1=pointToCoefficients(p1x, p1y, p2x, p2y);
	let line2=pointToCoefficients(q1x, q1y, q2x, q2y);
	let intersectionPoint : point = [0,0];
	try{
		intersectionPoint = getIntersection(line1, line2)
	} catch(err){
		if(err == "lines are too close to parallel"){
			return false;
		} else {
			throw err;
		}
	}
	return (between(intersectionPoint[0]  , p1x, p2x) &&
	between(intersectionPoint[0]  , q1x, q2x) &&
	between(intersectionPoint[1]  , p1y, p2y) &&
	between(intersectionPoint[1]  , q1y, q2y));
}
// doLinesIntersect(412, 666, 620 , 434, 689, 675, 421, 514) = true
// doLinesIntersect(412, 666, 620 , 434, 498 ,480 ,431 ,609 ) = false 
// doLinesIntersect(100, 100, 200, 100, 100, 200, 200, 200) = false

// cast a ray , and count number of intersections
export function pointInsidePolygon(x : number, y : number , points : [number, number][]) {
    noNaN(arguments as any);
    let dx = Math.random() + 1;
    let dy = Math.random();
    let max_x = max(points.map((x) => x[0])) - x; 
    let line = [x, y, x + dx * max_x, y + dy * max_x] ; 
    let counter = 0; 
    for(let i=0; i < points.length; i++){
		let next_point = i == points.length-1 ? points[0] : points[i+1]
        if(doLinesIntersect(line, points[i], next_point)){
            counter ++; 
        }
    }
    return counter % 2 == 1
}

// find where a line segment (given by two points) intersects the rectangle. the first point is inside the rectangle and the second point is outside.



 export function getLineEndWH(...args : (number | number[])[] ){
	noNaN(arguments as any);
	let lst = flatten_all(args);
	if(lst.length !=8){
		throw "getLineEndWH must have 6 points";
	}
	let [p1x , p1y , p2x , p2y , tlx , tly , width ,height] = lst;
	// ensure p1 is inside and 
	if(!pointInsideRectangleWH(p1x, p1y, tlx, tly,  width,height)){
		throw "p1 outside of rectangle";
	}
	if(pointInsideRectangleWH(p2x, p2y, tlx, tly, width,height)){
		throw "p2 inside rectangle";
	}
	//convert the line to ax+by=c
	// a (p2x - p1x) = -b (p2y - p1y)
	let a,b,c
	if(p2y - p1y != 0){ // a is not 0, set a = 1 (use this chart)
	// if a = 0 then b = 0 as well, we have 0 = c, so c = 0. This gives [0,0,0] which is not a point in P^2
	// a (p2x - p1x)/(p2y - p1y) = -b 
		a = 1;
		b = -(p2x - p1x)/(p2y - p1y);
		c = a*p1x + b*p1y ;
	} else {
		//p2y = p1y, so subtracting the equations gives a  = 0/(p2x - p1x) = 0
		// now we are in P^1 with b and c. We are solving by=c in P^1. 
		// so if y = 0 then we have [0,1,0]. Else, we have [0,?,1]
		a = 0;
		if(p2y == 0){
			b = 0;
			c = 0;
		} else{
			c = 1;
			b = c/p2y;
		}
	}
	let lineCoefficients : point3d= [a,b,c];
	let topLine : point3d= [0, 1, tly];// y = top left y
	let leftLine : point3d= [1, 0, tlx] // x = tlx
	let rightLine : point3d=[1, 0, tlx+width] // x = tlx+width
	let bottomLine : point3d= [0, 1, tly+height];// y = top left y + height
	let lines : point3d[]= [topLine, leftLine, rightLine, bottomLine]
	for(let i=0; i<4; i++){
		let line = lines[i]
		try {
			let intersection = getIntersection(lineCoefficients, line);
			// intersection must be inside the rectangle
			if(pointInsideRectangleWH(intersection[0], intersection[1],  tlx, tly,  width,height)){
			// and must also be in the correct direction of the second line:
				if((intersection[0] - p1x) * (p2x-p1x) + (intersection[1] - p1y) * (p2y-p1y) >= 0){
					return intersection;
				}
			}
		}catch (e){
			if(e == "lines are too close to parallel"){
				;
			} else {
				throw e;
			}
		}
	}
}

export function getLineEndBR(...args : (number | number[])[] ){
	noNaN(arguments as any);
	let lst = flatten_all(args);
	if(lst.length !=8){
		throw "getLineEndBR must have 6 points";
	}
	let [p1x , p1y , p2x , p2y , tlx , tly , brx ,bry] = lst;
	return getLineEndWH(p1x, p1y, p2x, p2y, tlx, tly, brx-tlx, bry-tly) ; 
}


 export function testCases(){
	//getLineEnd(p1x, p1y, p2x, p2y, tlx, tly, height, width){
	console.log("This should be 5,5")
	console.log(getLineEndWH(0,0,100,100,-10,-5,20,10)); // output should be 5,5, line is [1,-1,0]	
	
	console.log("This should be 166.216, 390")
	console.log(getLineEndWH(159.1,337.34,207.9,689.46,133,260,150,130)); // output should be 166.216, 390, line is [3.7,-0.5,420]

	
	console.log("This should be 207.407, 260")
	console.log(getLineEndWH(242,291.133,80,145.333,133,260,150,130)); // output should be 207.407, 260, line is [2.7,-3,-220]
	
	
	console.log("This should be 283, 328.033")
	console.log(getLineEndWH(242,291.133,445, 473.833,133,260,150,130)); // output should be 283, 328.033, line is [2.7,-3,-220]  
	
	console.log("This should be 174, 390 (vertical line)")
	console.log(getLineEndWH(174 ,300,174, 600,133,260,150,130)); // output should be 174, 390, line is [1,0,174] 
	
	
	console.log("This should be 133, 290 (horizontal line)")
	console.log(getLineEndWH(211 ,290,1, 290,133,260,150,130)); // output should be 133, 290, line is [0,1,290] 
	
	console.log("all done")
}



// returns the list of vertices visited, in order 
// neighbors is given as an oracle function
// note that neighbors is  NOT required to be symmetric (that is: the graph can be directed); 
export function bfs<T>(neighbors: (vertex: T) => T[], u: T, halting_condition ?: (vertex : T) => boolean ): T[] {
    let visited: Set<T> = new Set();
    let queue: T[] = [u];
    let result: T[] = [];

    while (queue.length > 0) {
        let vertex = queue.shift();
        if(vertex == undefined){ // empty list 
            break; 
        }
        // visit the vertex
        if (!visited.has(vertex)) {
            visited.add(vertex);
            result.push(vertex);
			if(halting_condition != undefined){
				if(halting_condition(vertex)){
					break;
				}
			}
            // add neighbors to the end of the list
            for (let neighbor of neighbors(vertex)) {
                if (!visited.has(neighbor)) {
                    queue.push(neighbor);
                }
            }
        }
    }
    return result;
}

	// given the coordinates of the top left (x and y smallest) corner of a rectangle, and its width and height, find the coordinates of the others. 
	// angle is  : look at rectangle's right, how much do you have to turn to look straight right?

	// the same as the other one : (positive x) is 0, and for angles close to 0, increasing is positive y. 
	
	//note this is different from the angle that angleToRadians returns. To convert from angleToRadians to our angle, add pi/2
	
	// returns the corners in a cyclic order. 
 export function corners(tlx:number , tly:number , width:number , height:number , angle:number) {
	//console.log([tlx, tly, width, height, angle]);
		let cornersLst = [[tlx, tly]]
		// travel "rightward" (width) units along (angle)
		cornersLst.push([cornersLst [0][0]+ width * Math.cos(angle), cornersLst[0][1] + width * Math.sin(angle)])
		
		//travel "upwards" (height) units along angle- 90 degrees
		cornersLst.push([cornersLst[1][0] + height * Math.cos(angle + Math.PI / 2), cornersLst[1][1]+ height * Math.sin(angle + Math.PI / 2)])
		
		//travel "upwards" from the start
		cornersLst.push([cornersLst[0][0] + height * Math.cos(angle + Math.PI / 2), cornersLst[0][1] + height * Math.sin(angle +Math.PI / 2)])
		
		
		return cornersLst
	}
	
