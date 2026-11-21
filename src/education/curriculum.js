/**
 * Hand-authored beginner course: 8 chapters × 2 exercises × 2 languages.
 * Read-output and write-the-missing-line tasks. Answers are checked against
 * explicit accepted strings, never by evaluating arbitrary Python/Go code.
 */
const task=(prompt,codeSnippet,answer,explanation,steps,other=[])=>({
  type:'short_text',mode:'complete',prompt,codeSnippet,
  expectedAnswer:String(answer),acceptedAnswers:[String(answer),...other.map(String)],
  explanation,steps:steps.length>=3?steps:[...steps,explanation],hint:steps[0]
});
const topic=(id,title,short,lesson,example,examples)=>({id,title,short,lesson,example,tasks:examples});
const python=[
  topic('print','Вывод на экран','print()',
    'Команда print() показывает текст или число в консоли. Текст обязательно помещают в кавычки.',
    'print("QAMAL")',[
    task('Что увидишь в консоли?', 'print("QAMAL")','QAMAL',
      'print выводит содержимое строки без кавычек.',
      ['В круглых скобках print находится строка в кавычках.','Кавычки обозначают начало и конец строки.','На экране появится только QAMAL.']),
    task('Допиши одну строку, которая напечатает слово Привет.', '# Нужно вывести приветствие','print("Привет")',
      'Для текста используют print("...").',
      ['Нужна функция print.','После имени функции ставятся круглые скобки.','Слово Привет берётся в двойные или одинарные кавычки.'],["print('Привет')"])
  ]),
  topic('variables','Переменные','= и имена',
    'Переменная хранит значение. В Python присваивание обозначается знаком =, а для чтения используют имя.',
    'code = 7\nprint(code)',[
    task('Что напечатает этот код?', 'code = 7\nprint(code)','7',
      'Переменная code хранит число 7.',
      ['Сначала выполни присваивание: code получает 7.','Затем print получает переменную code.','Поэтому выводится 7.']),
    task('Запиши строку, чтобы создать переменную score со значением 10.', '# число очков игры','score = 10',
      'Обычное присваивание в Python пишется через =.',
      ['Слева ставится имя переменной: score.','Справа от = ставится число 10.','Не заключай число в кавычки, если нужна именно числовая переменная.'])
  ]),
  topic('arithmetic','Арифметика','+ - * // %',
    'С числами используются +, -, *, /, // и %. // делит без дробной части, % даёт остаток.',
    'energy = 11\nprint(energy // 3)',[
    task('Какой результат напечатает программа?', 'energy = 11\nprint(energy // 3)','3',
      '11 // 3 равно 3: целая часть деления.',
      ['11 делится на 3: получаем 3 полных тройки.','Остаток 2 не входит в результат оператора //.','Печатается число 3.']),
    task('Напиши выражение для остатка 11 от деления на 3.', '# остаток деления','11 % 3',
      'Знак % означает остаток.',
      ['Обычный символ деления / нам не подходит.','% возвращает оставшуюся часть после деления.','Запись: 11 % 3.'])
  ]),
  topic('conditions','Условия','if / else',
    'if выполняет код только при истинном условии. Блок после if и else пишут с отступом.',
    'if score >= 5:\n    print("OK")',[
    task('Что выведет код?', 'score = 8\nif score >= 5:\n    print("OK")\nelse:\n    print("NO")','OK',
      'Условие 8 >= 5 истинно, поэтому запускается ветка if.',
      ['Подставь score = 8.','Сравни 8 и 5: 8 больше либо равно 5.','Выполняется print("OK"), ветка else пропускается.']),
    task('Напиши условие: если x больше 10 (только заголовок if).', '# проверка x','if x > 10:',
      'В Python после условия ставится двоеточие.',
      ['Начни с ключевого слова if.','Сравни x и 10 оператором >.','Заверши заголовок знаком :.' ])
  ]),
  topic('loops','Циклы','for / range',
    'Цикл for с range(n) выполняет действие n раз, начиная с 0 и не включая n.',
    'for i in range(3):\n    print(i)',[
    task('Сколько чисел будет напечатано?', 'for i in range(4):\n    print(i)','4',
      'range(4) даёт четыре значения: 0,1,2,3.',
      ['range(4) начинается с нуля.','Последнее значение — 3, число 4 не включается.','print вызывается четыре раза.']),
    task('Напиши заголовок цикла, который повторится 3 раза.', '# повторить трижды','for i in range(3):',
      'range(3) создаёт 3 итерации.',
      ['Ключевые слова: for ... in.','Итератор назови i, диапазон — range(3).','Поставь двоеточие в конце.'])
  ]),
  topic('lists','Списки','[] / индекс',
    'Список хранит несколько элементов. Первый элемент имеет индекс 0, второй — индекс 1.',
    'nums = [4, 9, 2]\nprint(nums[1])',[
    task('Что напечатает программа?', 'nums = [4, 9, 2]\nprint(nums[1])','9',
      'Индекс 1 обозначает второй элемент: 9.',
      ['В списке три числа: 4, 9, 2.','Индексация начинается с 0.','Поэтому nums[1] равно 9.']),
    task('Запиши обращение к третьему элементу списка nums.', '# элементы 0, 1, 2','nums[2]',
      'Третий элемент имеет индекс 2.',
      ['Первый элемент — nums[0].','Второй — nums[1].','Третий — nums[2].'])
  ]),
  topic('functions','Функции','def / return',
    'Функции помогают не повторять код. def задаёт имя, return возвращает значение.',
    'def double(x):\n    return x * 2\nprint(double(4))',[
    task('Чему равен результат?', 'def double(x):\n    return x * 2\nprint(double(6))','12',
      'Функция double умножает аргумент 6 на 2.',
      ['Вызов double(6) передаёт 6 параметру x.','return вычисляет x * 2.','6 * 2 = 12.']),
    task('Напиши заголовок функции greet с одним параметром name.', '# тело будет ниже','def greet(name):',
      'Функцию объявляют через def и заканчивают заголовок двоеточием.',
      ['Начни с def и имени greet.','Помести параметр name в круглые скобки.','Заверши заголовок двоеточием.'])
  ]),
  topic('nested','Вложенные циклы','два for',
    'Когда цикл находится внутри другого, внутренний выполняется на каждом шаге внешнего.',
    'for a in range(2):\n    for b in range(3):\n        print(a,b)',[
    task('Сколько раз выполнится print?', 'for a in range(2):\n    for b in range(3):\n        print(a, b)','6',
      'Два внешних шага по три внутренних — всего шесть.',
      ['Внешний цикл повторится 2 раза.','Для каждого внешнего шага внутренний цикл повторится 3 раза.','Общее количество 2 × 3 = 6.']),
    task('Какое число укажешь в range(), чтобы внутренний цикл выполнился 5 раз?', '# for b in range(___):','5',
      'range(5) создаёт пять значений.',
      ['range(n) проходит от 0 до n−1.','Чтобы было 5 повторений, укажи n = 5.'])
  ])
];
const go=[
  topic('print','Вывод на экран','fmt.Println',
    'В Go для вывода удобно использовать fmt.Println. Обычно импортируют пакет fmt. Текст записывается в двойных кавычках.',
    'fmt.Println("QAMAL")',[
    task('Что выведет этот вызов?', 'fmt.Println("QAMAL")','QAMAL',
      'fmt.Println выводит строку QAMAL.',
      ['fmt — пакет для форматированного вывода.','Println печатает значение в скобках.','Кавычки не входят в результат вывода.']),
    task('Напиши одну строку, которая выведет Привет.', '// import "fmt" уже добавлен','fmt.Println("Привет")',
      'Для вывода используют fmt.Println.',
      ['В Go имя метода пишется с заглавной P: Println.','Функция находится в пакете fmt.','В круглых скобках стоит строка в двойных кавычках.'])
  ]),
  topic('variables','Переменные','var / :=',
    'Короткая запись := создаёт переменную внутри функции. Чтобы изменить существующую переменную, используют =.',
    'score := 10\nfmt.Println(score)',[
    task('Чему равен вывод?', 'score := 7\nfmt.Println(score)','7',
      'Переменная score содержит 7.',
      ['Оператор := создаёт переменную score.','После присваивания score равен 7.','fmt.Println печатает 7.']),
    task('Запиши короткое объявление переменной score со значением 10.', '// внутри func main()','score := 10',
      'Оператор := объявляет новую переменную.',
      ['Слева укажи имя score.','Для объявления выбери :=, а не просто =.','Справа напиши целое число 10.'])
  ]),
  topic('arithmetic','Арифметика','целые числа',
    'В Go если два числа имеют тип int, деление возвращает целую часть. % означает остаток.',
    'a := 11\nfmt.Println(a / 3)',[
    task('Какое число будет напечатано?', 'a := 11\nfmt.Println(a / 3)','3',
      'Для int операция 11 / 3 возвращает целое число 3.',
      ['a имеет тип int, потому что создано как целое число 11.','Деление int / int возвращает int.','Дробная часть отбрасывается, остаётся 3.']),
    task('Запиши выражение остатка 11 от деления на 3.', '// выражение Go','11 % 3',
      'Оператор % используется для остатка.',
      ['Нужен остаток, а не результат деления.','В Go % работает для целых чисел.','Запись 11 % 3.'])
  ]),
  topic('conditions','Условия','if без скобок',
    'Go использует if условие { ... }. Скобки вокруг условия не нужны, но фигурные скобки для тела обязательны.',
    'if score >= 5 {\n    fmt.Println("OK")\n}',[
    task('Что выведет программа?', 'score := 8\nif score >= 5 {\n    fmt.Println("OK")\n} else {\n    fmt.Println("NO")\n}','OK',
      '8 >= 5 истинно, печатается OK.',
      ['Подставь score = 8.','Сравни 8 >= 5: это true.','Выполнится код в первом блоке if.']),
    task('Напиши заголовок условия: если x больше 10 (с открывающей {).', '// тело будет ниже','if x > 10 {',
      'В Go блок if открывается фигурной скобкой.',
      ['Сначала if и проверка x > 10.','Не ставь двоеточие, как в Python.','Открой блок фигурной скобкой {.'])
  ]),
  topic('loops','Циклы','for',
    'В Go вместо while обычно используют for. Счётчик можно менять через i++.',
    'for i := 0; i < 3; i++ {\n    fmt.Println(i)\n}',[
    task('Сколько раз выполнится тело цикла?', 'for i := 0; i < 4; i++ {\n    fmt.Println(i)\n}','4',
      'Счётчик принимает значения 0, 1, 2 и 3.',
      ['Начальное значение i равно 0.','Цикл продолжается, пока i < 4.','i++ увеличивает счётчик, всего 4 прохода.']),
    task('Напиши увеличение переменной i на единицу через оператор Go.', '// внутри цикла','i++',
      'i++ прибавляет единицу.',
      ['Переменная называется i.','Оператор ++ — постфиксный инкремент.','Запись i++.'])
  ]),
  topic('slices','Срезы','[]int / len',
    'Срез []int содержит несколько целых чисел. Индексы начинаются с нуля. len возвращает число элементов.',
    'nums := []int{4, 9, 2}\nfmt.Println(nums[1])',[
    task('Что будет выведено?', 'nums := []int{4, 9, 2}\nfmt.Println(nums[1])','9',
      'Индекс 1 указывает на второй элемент.',
      ['В срезе значения 4, 9 и 2.','Нумерация начинается с 0.','nums[1] = 9.']),
    task('Напиши выражение длины среза nums.', '// сколько элементов?','len(nums)',
      'len(nums) возвращает количество элементов.',
      ['В Go используется встроенная функция len.','В скобки поставь имя среза nums.','Получится len(nums).'])
  ]),
  topic('functions','Функции','func / return',
    'Функции Go объявляют через func. При необходимости указывают тип аргумента и тип результата.',
    'func double(x int) int { return x * 2 }',[
    task('Что напечатает функция?', 'func double(x int) int { return x * 2 }\nfmt.Println(double(6))','12',
      'double(6) возвращает 6 × 2 = 12.',
      ['Параметр x получает число 6.','return умножает x на два.','Результат функции 12.']),
    task('Напиши объявление функции sum с аргументами a и b типа int и результатом int. Открой тело {.', '// заголовок функции','func sum(a int, b int) int {',
      'Go явно указывает типы входных аргументов и результата.',
      ['Напиши func и имя sum.','В скобках укажи a int, b int.','После параметров укажи int и открывающую фигурную скобку.'],['func sum(a, b int) int {'])
  ]),
  topic('nested','Вложенные циклы','for внутри for',
    'Два вложенных цикла выполняют работу для каждой пары значений счётчиков.',
    'for i := 0; i < 2; i++ {\n    for j := 0; j < 3; j++ {\n        fmt.Println(i,j)\n    }\n}',[
    task('Сколько раз вызовется fmt.Println?', 'for i := 0; i < 2; i++ {\n    for j := 0; j < 3; j++ {\n        fmt.Println(i,j)\n    }\n}','6',
      'Внешний цикл 2 раза, внутренний 3 раза; 2×3=6.',
      ['Внешний for выполняется 2 раза.','Для каждого i внутренний for выполняется 3 раза.','Вместе это 6 вызовов fmt.Println.']),
    task('Сколько повторений внутреннего цикла нужно, если внешний 2 раза, а всего 10?', '// два вложенных for','5',
      '10 / 2 = 5 повторений.',
      ['Всего 10 выполнений.','Внешний цикл 2 раза.','Значит внутренний должен быть 5 раз.'])
  ])
];
export const COURSES=Object.freeze({python,go});
export function getCourse(language){
  if(!Object.hasOwn(COURSES,language))throw new RangeError('Доступны только Python и Go');
  return COURSES[language];
}
export function lessonAt(language,index){
  const course=getCourse(language);
  if(!Number.isInteger(index)||index<0||index>=course.length)throw new RangeError('Нет такого урока');
  return course[index];
}
export function validateProgress(raw){
  const result={python:[],go:[]};
  for(const language of ['python','go']){
    const valid=new Set();
    if(Array.isArray(raw?.[language])){
      for(const i of raw[language])if(Number.isInteger(i)&&i>=0&&i<getCourse(language).length)valid.add(i);
    }
    result[language]=[...valid].sort((a,b)=>a-b);
  }
  return result;
}
// Treat insignificant whitespace around Python/Go punctuation as equivalent.
// We still do NOT evaluate submitted source code, which is why only
// prepared single-line examples and output values are checked here.
export function isCorrectLessonAnswer(question,answer){
  const normalize=s=>String(s??'').trim().toLowerCase()
    .replace(/\s*([(){}\[\]=+%<>:,])\s*/g,'$1').replace(/\s+/g,' ');
  return Array.isArray(question?.acceptedAnswers)&&
    question.acceptedAnswers.some(expected=>normalize(expected)===normalize(answer));
}
export function diagnoseLessonError(question,answer,attempt=1){
  const value=String(answer??'').trim();
  const normalized=value.replace(/\s+/g,' ').toLowerCase();
  const expected=String(question.expectedAnswer);
  const correct=isCorrectLessonAnswer(question,answer);
  if(correct)return{correct:true,title:'Верно!',message:question.explanation,steps:question.steps,answer:expected,reveal:false};
  let issue='Попробуй проследить код слева направо, не пропуская присваивания и условия.';
  if(!value)issue='Ответ пока пустой. Введи результат или недостающую строку.';
  else if(/^\d+$/.test(expected)&&/^[+-]?\d+$/.test(value))issue='Похоже, ошибка в вычислении или числе повторений: проверь значения по шагам.';
  else if(expected.includes('print')&&(!/print/i.test(value)||/printf?\(/i.test(value)&&!expected.includes('printf')))issue='Обрати внимание на название функции вывода, кавычки и круглые скобки.';
  else if(expected.includes(':=')&&value.includes('=')&&!value.includes(':='))issue='В Go для объявления новой переменной используется :=, а не просто =.';
  else if(expected.startsWith('if')&&(value.includes(':')!==expected.includes(':')))issue='Python завершает условие двоеточием, Go открывает блок фигурной скобкой.';
  else if(expected.includes('[')&&/\[\d+\]/.test(expected))issue='Проверь индекс: первый элемент массива или списка имеет номер 0.';
  else if(expected.includes('range')&&value.includes('range'))issue='Убедись, что range(n) не включает n и у заголовка есть двоеточие.';
  return {correct:false,title:attempt>=2?'Разбор ошибки':'Проверим ещё раз',message:issue,steps:question.steps,answer:expected,reveal:attempt>=2};
}
