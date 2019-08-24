const POINT_TAG = "div";
const POINT_CLASS = "point";

const DEFAULT_COLOR_LONELY = "#111111";
const DEFAULT_COLOR_CROWDED = "#FF0F00";
const DEFAULT_CROWDED_LIMIT = 8;
const DEFAULT_DISTANCE_PER_FRAME = 1;
const DEFAULT_RADIUS = 2.5;


/**
 * Класс частицы
 */
export class Point{

    props = {
        colorLonely:DEFAULT_COLOR_LONELY,
        colorCrowded:DEFAULT_COLOR_CROWDED,
        speed:DEFAULT_DISTANCE_PER_FRAME,
        crowdedLimit:DEFAULT_CROWDED_LIMIT,
        radius:DEFAULT_RADIUS,
    }

    element = null;
    index = null;
    pos = [0,0];
    target = [0,0];
    bounds = [[0,0],[0,0]];
    bufferDistance = 0;

    constructor(container, index, position = [1,1], target = [0,0], bufferDistance = 20, params={}){

        this.props = Object.assign(this.props, params);

        this.index = index;
        this.element = document.createElement(POINT_TAG);
        this.element.classList.add(POINT_CLASS);

        this.element.style.width = 2*this.props.radius + "px";
        this.element.style.height = 2*this.props.radius + "px";
        this.element.style.borderRadius = 2*this.props.radius + "px";

        this.pos = position;
        this.target = target;
        this.bufferDistance = bufferDistance;

        let containerRect = container.getBoundingClientRect();
        this.bounds = [[0,0],[containerRect.width,containerRect.height]];

        container.appendChild(this.element);

    }

    /**
     * Шаг, который частица выполняет за кадр
     */
    step = (map,scrambleForce) => {

        let movementVector = this._getMovementVector(scrambleForce);
        let aversionVector = this._getAversionVector(map);
        let targetVector = this._avgVec(movementVector,aversionVector);

        this.pos = this._addVec(this.pos,targetVector);
        this.pos = this._clampVecToRect(this.pos);

        let neighbourCount = map.length;
        this.neighbours = neighbourCount;

        this.setStyles();

    }

    /**
     * Устанавливает стили html-элемента
     */
    setStyles = ()=>{

        if(this.neighbours>this.props.crowdedLimit){this.neighbours = this.props.crowdedLimit;}
        let crowdedRatio = this.neighbours/this.props.crowdedLimit;

        this.element.style.backgroundColor = this._lerpColor(crowdedRatio);

        this.element.style.left = this.pos[0]-5+"px";
        this.element.style.top = this.pos[1]-5+"px";
    }

    /**
     * Высчитывает вектор движения к цели частицы
     */
    _getMovementVector=(scrambleForce)=>{
        let targetVector = this._getVecTo(this.target);
        if(scrambleForce){
            targetVector = [targetVector[0]*(-scrambleForce),targetVector[1]*(-scrambleForce)];
        }
        return targetVector
    }

    /**
     * Высчитывает вектор движения от соседних частиц
     */
    _getAversionVector=(map)=>{
        let aversionVector = [0,0];
        map.forEach(collision=>{
            if(collision.dist === 0){
                aversionVector = this._addVec([Math.random(),Math.random()], aversionVector);//Кидаем в случайную сторону если с две частицы занимают одно и то же место
            }
            let speed = (this.bufferDistance - collision.dist)/2;//Скорость делим на два, потому что обратный вектор будет применен к соседу
            let bumpVector = this._getVecTo(collision.dot.pos,true,speed);
            aversionVector = this._addVec(aversionVector,bumpVector);
        });
        return aversionVector;
    }

    /**
     * Рассчитывает вектор движения к (или от) другой точке на расстояние speed
     */
    _getVecTo = (target,away = false,speed = this.props.speed)=>{

        let vec = [
            target[0]-this.pos[0],
            target[1]-this.pos[1]
        ];

        let magnitude = Math.sqrt(
            Math.abs(vec[0]*vec[0]+vec[1]*vec[1])
        );

        if(magnitude===0){return [0,0];}

        let unitVec = [vec[0]/magnitude,vec[1]/magnitude];
        let movementVec = [unitVec[0]*speed,unitVec[1]*speed];

        if(away===true){movementVec = [-movementVec[0],-movementVec[1]];}

        return movementVec;
    }

    /**
     * Складывает два вектора
     */
    _addVec = (a,b)=>[(a[0]+b[0]),(a[1]+b[1])];

    /**
     * То же самое, но со средней величиной вектора
     */
    _avgVec = (a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];

    /**
     * Ограничивает вектор пространством прямоугольника
     */
    _clampVecToRect = (vec,min=[this.bounds[0][0],this.bounds[0][1]],max=[this.bounds[1][0],this.bounds[1][1]]) => {
        if(vec[0]<min[0]){vec[0]=min[0];}
        if(vec[0]>max[0]){vec[0]=max[0];}
        if(vec[1]<min[1]){vec[1]=min[1];}
        if(vec[1]>max[1]){vec[1]=max[1];}
        return vec;
    }

    /**
     * Интерполирует мужду двумя цветами в зависимости от переданного значения от 0 до 1
     */
    _lerpColor(ratio){
        let a = this.props.colorLonely;
        let b = this.props.colorCrowded;

        var ah = parseInt(a.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        bh = parseInt(b.replace(/#/g, ''), 16),
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + ratio * (br - ar),
        rg = ag + ratio * (bg - ag),
        rb = ab + ratio * (bb - ab);

        return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
    }
}
