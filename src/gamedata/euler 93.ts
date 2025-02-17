function combine(things  :number[]) : number[][]{
    if(things.length == 1){
        return [things]
    }
    let first_combines : number[][] = []; 
    for(let i=1; i < things.length; i++){
        let [x,y] = [things[0], things[i]];
        let first_two =  [[x+y], [x*y], [x-y], [y-x]]
        if(x != 0){
            first_two.push([y/x]);
        }
        if(y != 0){
            first_two.push([x/y]);
        }         
        let remainder = [...things];
        remainder.splice(i, 1);
        remainder.splice(0, 1);
        first_combines = first_combines.concat(first_two.map(a => a.concat(remainder))); 
    }

    if(things.length == 2){
        return first_combines; 
    }
    
    let combine_rest = combine(things.slice(1));
    return first_combines.concat(combine_rest.map(b => [things[0]].concat(b)))
}

function unique(things : number[], epsilon : number = 0.00001) : number[] {
    let result : number[] = [];
    for(let item of things){
        let uniq = true;
        for(let existing of result){
            if(Math.abs(existing - item) < epsilon){
                uniq = false;
                break;
            }
        }
        if(uniq){
            result.push(item);
        }
    }
    return result;
}

function consecutive(things : number[], epsilon : number = 0.00001){
    let i = 1;
    while(true){
        // if i is not in there, return i-1
        let found = false; 
        for(let item of things){
            if(Math.abs(item - i) < epsilon){
                i++;
                found = true;
                break;
            }
        }
        if(!found){
            return i-1;
        }
    }
}
function recursive_combine(things : number[]) : number[] {
    if(things.length == 1){
        return things; 
    }
    let lst = combine(things);
    let outlst : number[] = [];
    for(let item of lst){
        outlst = outlst.concat(recursive_combine(item));
    }
    return unique(outlst); 
}

export function run(){
    let max = 0;
    for(let a = 0; a < 10; a++){
        for(let b = a; b < 10; b++){
            for(let c = b; c < 10; c++){
                for(let d = c; d < 10; d++){
                    let value = consecutive(recursive_combine([a,b,c,d]));
                    
                    if(value > max){
                        max = value;
                        console.log([a,b,c,d , value]);
                    }
                }
            }
        }
    }
    console.log(max);
}
