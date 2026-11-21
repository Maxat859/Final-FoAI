/**
 * Deterministic programming exercise bank: 240 Python and 240 Go tasks.
 * Fifteen families per language, each with sixteen generated variants.
 * These are reading and debugging exercises, NOT an arbitrary code executor.
 */
function Q(title,code,answer,explanation,prompt="Какой результат выведет программа?"){
  return {title,prompt,codeSnippet:code,expectedAnswer:String(answer),
    acceptedAnswers:[String(answer)],explanation,
    hint:"Внимательно проверь каждую строку кода и порядок операций."};
}
const py={
  easy:[
    i=>{const n=i+3;return Q("Сложение","print("+n+" + 4)",n+4,"Складываются два целых числа.");},
    i=>{const n=i+11;return Q("Целочисленное деление","n = "+n+"\nprint(n // 3)",Math.floor(n/3),"Оператор // отбрасывает дробную часть.");},
    i=>{const n=i+2;return Q("Индекс списка","rooms = ["+n+", "+(n+2)+", "+(n+4)+"]\nprint(rooms[1])",n+2,"Индекс 1 соответствует второму элементу.");},
    i=>{const n=i+4;return Q("Цикл range","for x in range("+n+"):\n    print(x) ",n,"range(n) выполняет тело n раз.","Сколько раз выполнится print?");},
    i=>{const n=i+10;return Q("Остаток деления","print("+n+" % 4)",n%4,"Оператор % вычисляет остаток.");}
  ],
  medium:[
    i=>{const n=i+5;return Q("Сумма range","total = 0\nfor x in range("+n+"):\n    total += x\nprint(total)",n*(n-1)/2,"Сумма 0..n−1 равна n(n−1)/2.");},
    i=>{const n=i+3;return Q("Срезы","v = ["+[n,n+1,n+2,n+3,n+4].join(", ")+"]\nprint(sum(v[1:4]))",3*n+6,"Срез [1:4] содержит элементы с индексами 1,2,3.");},
    i=>{const n=i%6+4;return Q("Вложенные циклы","count=0\nfor a in range("+n+"):\n    for b in range(3):\n        count+=1\nprint(count)",3*n,"Общее количество = n×3.");},
    i=>{const n=i+3;return Q("Функция","def signal(x):\n    return x*2+1\nprint(signal("+n+"))",2*n+1,"Подставьте аргумент функции в return.");},
    i=>{const n=i+5;return Q("Словарь","scores={'A':"+n+",'B':"+(n+3)+"}\nprint(scores['B']-scores['A'])",3,"Значения извлекаются по ключу, затем вычитаются.");}
  ],
  hard:[
    i=>{const n=i%8+8;let sum=0;for(let j=0;j<n;j++)if(j%2)sum+=j;return Q("continue","s=0\nfor x in range("+n+"):\n    if x % 2 == 0:\n        continue\n    s+=x\nprint(s)",sum,"continue пропускает чётные значения.");},
    i=>{const n=i%4+3;let f=1;for(let j=2;j<=n;j++)f*=j;return Q("Рекурсия","def f(n):\n    return 1 if n<2 else n*f(n-1)\nprint(f("+n+"))",f,"Функция вычисляет факториал.");},
    i=>{const n=i+5;return Q("Изменяемые списки","a=["+[n,n+1,n+2].join(",")+"]\na.append("+(n+3)+")\na.pop(1)\nprint(a[1])",n+2,"После удаления второго элемента на его место переходит третий.");},
    i=>{const n=i%5+4;let count=0;for(let a=0;a<n;a++)for(let b=0;b<n;b++)if((a+b)%2===0)count++;return Q("Двойной цикл и if","cnt=0\nfor a in range("+n+"):\n    for b in range("+n+"):\n        if (a+b)%2 == 0:\n            cnt+=1\nprint(cnt)",count,"Считаются пары чисел с одинаковой чётностью.");},
    i=>{const n=i+8;return Q("Исключения","try:\n    value = "+n+" // 0\nexcept ZeroDivisionError:\n    value = "+(n+1)+"\nprint(value)",n+1,"При делении на ноль срабатывает блок except.");}
  ]
};
const go={
  easy:[
    i=>{const n=i+2;return Q("Сложение Go","a := "+n+"\nfmt.Println(a + 5)",n+5,"fmt.Println печатает сумму.");},
    i=>{const n=i+9;return Q("Остаток Go","fmt.Println("+n+" % 4)",n%4,"Оператор % — остаток от деления.");},
    i=>{const n=i+3;return Q("Индекс среза","v := []int{"+n+","+(n+2)+","+(n+4)+"}\nfmt.Println(v[1])",n+2,"Индекс 1 соответствует второму элементу.");},
    i=>{const n=i%7+3;return Q("len(slice)","v := []int{"+Array.from({length:n},(_,j)=>j).join(",")+"}\nfmt.Println(len(v))",n,"len возвращает количество элементов.");},
    i=>{const n=i+7;return Q("Цикл for","for i:=0; i<"+n+"; i++ {\n    fmt.Println(i)\n}",n,"i принимает значения от 0 до n−1.","Сколько раз выполняется тело цикла?");}
  ],
  medium:[
    i=>{const n=i+3;return Q("append","v := []int{"+n+","+(n+1)+"}\nv=append(v,"+(n+2)+")\nfmt.Println(len(v))",3,"append добавляет один элемент.");},
    i=>{const n=i+4;return Q("range среза","s:=0\nfor _,x:=range []int{"+n+","+(n+1)+","+(n+2)+"} {\n    s+=x\n}\nfmt.Println(s)",3*n+3,"range перебирает все три числа.");},
    i=>{const n=i+5;return Q("Функция Go","func twice(x int) int { return x*2 }\nfmt.Println(twice("+n+"))",n*2,"Возвращается x×2.");},
    i=>{const n=i+5;return Q("Map","m:=map[string]int{\"a\":"+n+",\"b\":"+(n+2)+"}\nfmt.Println(m[\"b\"])",n+2,"Обращение к map по ключу b.");},
    i=>{const n=i+9;return Q("Разыменование","x:="+n+"\np:=&x\nfmt.Println(*p)",n,"*p читает значение переменной по адресу.");}
  ],
  hard:[
    i=>{const n=i+3;return Q("Указатель и изменение","x:="+n+"\np:=&x\n*p+=7\nfmt.Println(x)",n+7,"Изменение *p изменяет исходную переменную.");},
    i=>{const n=i%5+4;let cnt=0;for(let a=0;a<n;a++)for(let b=0;b<n;b++)if((a+b)%2===0)cnt++;return Q("Вложенные циклы и if","c:=0\nfor a:=0;a<"+n+";a++ {\n for b:=0;b<"+n+";b++ {\n  if (a+b)%2==0 { c++ }\n }\n}\nfmt.Println(c)",cnt,"Подсчёт пар с чётной суммой.");},
    i=>{const n=i+17;return Q("Целочисленное деление","a:="+n+"\nfmt.Println(a/4)",Math.floor(n/4),"int делится на int без дробной части.");},
    i=>{const n=i+5;return Q("Связанный slice","a:=[]int{"+n+","+(n+1)+","+(n+2)+"}\nb:=a[1:]\nb[0]="+(n+10)+"\nfmt.Println(a[1])",n+10,"Два среза используют один underlying array.");},
    i=>{const n=i+8;return Q("Изменение map","m:=map[string]int{\"x\":"+n+"}\nm[\"x\"]+=3\nfmt.Println(m[\"x\"])",n+3,"Изменяется значение ключа x.");}
  ]
};

export const DIFFICULTIES=Object.freeze(["easy","medium","hard"]);
const titles={easy:"Лёгкое",medium:"Среднее",hard:"Сложное"};
const all=new Map();

export function buildQuestionBank(language){
  if(language!=="python"&&language!=="go")throw new RangeError("Неизвестный язык");
  const families=(language==="python"?py:go),result=[];
  for(const difficulty of DIFFICULTIES){
    for(let f=0;f<families[difficulty].length;f++){
      for(let i=0;i<16;i++){
        const item=families[difficulty][f](i);
        result.push({...item,
          id:[language,difficulty,f,i].join("-"),
          language,difficulty,mode:"read",type:"short_text",
          title:titles[difficulty]+" · "+item.title
        });
      }
    }
  }
  return result;
}
export function questionsFor(language,difficulty){
  if(!DIFFICULTIES.includes(difficulty))throw new RangeError("Неизвестная сложность");
  if(!all.has(language))all.set(language,buildQuestionBank(language));
  return all.get(language).filter(q=>q.difficulty===difficulty);
}
export function selectQuestion(language,difficulty,seed=0){
  const list=questionsFor(language,difficulty);
  return list[((Math.trunc(seed)%list.length)+list.length)%list.length];
}
