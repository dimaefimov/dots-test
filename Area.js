import { Point } from './Point.js';

const DEFAULT_NUMBER_OF_DOTS = 500;
const DEFAULT_INTERVAL = 1000/24; //24 раза в секунду
const DEFAULT_SCRAMBLE_FORCE = 80;
const DEFAULT_SCRAMBLE_FORCE_FALLOFF = 0.8;
const DEFAULT_BUFFER_DISTANCE = 20; 

/**
 * Основной класс компонента. Представляет из себя область, в которой будут взаимодействовать частицы.
 */
export class Area{

    props = {
        numberOfDots:DEFAULT_NUMBER_OF_DOTS,
        tickInterval:DEFAULT_INTERVAL,
        maxScrambleForce:DEFAULT_SCRAMBLE_FORCE,
        scrambleForceFalloff:DEFAULT_SCRAMBLE_FORCE_FALLOFF,
        bufferDistance:DEFAULT_BUFFER_DISTANCE,
        point:{}
    };

    dotRegistry = new Set();
    distanceMap = {};

    container = {
        element: null,
        size: []
    };

    scrambleForce = 0;

    constructor(params={}){
        this.props = Object.assign(this.props, params);
    }


    /**
     * Инициализация класса. Собирает информацию о контейнере, назначает события для кликов,
     * создает в случайных местах точки и запускает по интервалу tick
     */
    init(container){
        if(!(container instanceof HTMLElement)){
            return null;
        }

        let containerBounds = container.getBoundingClientRect();

        this.container = {
            element: container,
            size: [containerBounds.width, containerBounds.height],
            center: [containerBounds.width/2, containerBounds.height/2],
        };

        this.spawnRandomDots(this.props.numberOfDots);

        this._assignEvents();

        setInterval(this.tick,this.props.tickInterval)
    }

    /**
     * Исполняется каждый кадр. Вызывает метод обновления каждой частицы.
     */
    tick = () => {
        this.handleScramble();
        this.makeDistanceMap();
        this.dotRegistry.forEach(dot=>{dot.step(this.distanceMap[dot.index],this.scrambleForce)});
    }

    /** 
     * Откидывает частицы
     */
    handleScramble = () => {
        if(this.scrambleForce>0&&(this.scrambleForce*=this.props.scrambleForceFalloff)<0.1){
            this.scrambleForce=0;
        }
    }

    /**
     * Создает в случайных местах на экране частицы
     */
    spawnRandomDots = (numOfDots)=>{
        for(let i = 0; i<numOfDots; i++){
            let startPos = [
                Math.round(Math.random()*this.container.size[0]),
                Math.round(Math.random()*this.container.size[1])
            ];
            this.spawnDot(i, startPos, this.container.center);
        }
    }

    spawnDot = (index,position,target)=>{
      let point = new Point(this.container.element,index,position,target,this.props.bufferDistance, this.props.point);
      this.dotRegistry.add(point);
    }

    /**
     * Создает объект с записями о всех пересекающихся точках и их расстояниях. Индексирован идентификаторами точек
     */
    makeDistanceMap = () => {
        let pool = new Set(this.dotRegistry);
        this.distanceMap = {};
        for(let dot of pool){
            pool.delete(dot);
            if(!this.distanceMap[dot.index]){this.distanceMap[dot.index] = [];}
            for(let otherDot of pool){
                let dist = this._getDistance(dot.pos,otherDot.pos);
                if(dist<this.props.bufferDistance){
                    if(!this.distanceMap[otherDot.index]){this.distanceMap[otherDot.index] = [];}
                    this.distanceMap[dot.index].push({dist,dot:otherDot});
                    this.distanceMap[otherDot.index].push({dist,dot});
                }
            }
        }
    }

    /**
     * Назначает события клика на элемент контейнера
     */
    _assignEvents(){
        this.container.element.addEventListener('mouseup',(e)=>{

            if(e.ctrlKey||e.metaKey){

              this.scrambleForce = this.props.maxScrambleForce;

            }else{

              this.spawnDot(this.dotRegistry.size+1, [e.clientX,e.clientY], this.container.center);

            }
        });
    }

    /**
     * Вспомогательный метод для рассчета расстояния между двумя векторами
     */
    _getDistance(pos1,pos2){
        let a = pos1[0] - pos2[0];
        let b = pos1[1] - pos2[1];
        return Math.sqrt(a*a + b*b);
    }
}
