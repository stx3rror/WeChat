document.addEventListener('DOMContentLoaded', function() {

  //##########################VARIABLES##########################

  var my_api_key = "";
  var roleAI = "Eres un asistente dispuesto a resolver dudas puntuales de la forma más óptima y rápida posible. Responderás en español.";
  const divMain = document.getElementById("main_container");
  //Acordeon Input
  const btnAcordeonInput = document.getElementsByClassName("accs")[0];
  const btnCopiarTextAreaInput = document.getElementsByClassName('copiar')[0];
  const btnBorrarTextAreaInput = document.getElementsByClassName('borrar')[0];
  const tagTextAreaInput = document.getElementById("inputArea");
  //Acordeon Output
  const btnAcordeonOutput = document.getElementsByClassName("accs")[1];
  const btnCopiarTextAreaOutput = document.getElementsByClassName('copiar')[1];
  const btnBorrarTextAreaOutput = document.getElementsByClassName('borrar')[1];
  const tagTextAreaOutput = document.getElementById("output");
  const tagSelectIdioma = document.getElementById("idioma");
  const btnEnviar = document.getElementById('submitBtn');
  const loadOutput =  document.getElementById('outputLoad');
  
  //Ajustes
  const btnAjustes = document.getElementById("ajustes");
  const divAjustes = document.getElementById("cont_ajustes");
  const divAjustesTagApiKey = document.getElementById("cont_ajustes_field_api_key");
  const divAjustesBtnVolver = document.getElementById("cont_ajustes_volver");
  const tagErrorMensaje= document.getElementById("tagError");
  const divAjustesTagIdiomas = document.getElementsByTagName("a");
  const tagIdiomaAjustes = document.getElementById("tagIdiomaAjustes");
  const labelApiAjustes = document.getElementById("labelApiAjustes");
  var lang = "Español";
  tagErrorMensaje.value = "";

  //##########################STORAGES##########################

  chrome.storage.local.get(['lang','historico_output','historico_input','api_key']).then((result) => {
    
    if(result.historico_output){
      tagTextAreaOutput.value = result.historico_output;
    }

    if(result.historico_input){
      tagTextAreaInput.value = result.historico_input;
    }

    if(result.api_key){
      my_api_key=result.api_key;//VARIABLE ENVIADA A OPENAI
      divAjustesTagApiKey.value = my_api_key;//SE SETA EN EL CAMPO
    }
    if(result.lang){
      lang = result.lang;
      let indice = buscarIndicePorValor(tagIdiomaAjustes.options,lang);
      if(indice!=-1){
        tagIdiomaAjustes.options[indice].selected = true;
      }
    }
    reloadLanguage();
    divMain.style.display = "block";
  });

  //##########################IDIOMA##########################
  const Label = {
    Español: {
      InvalidAPIKeyException: 'Clave API inválida.',
      EmptyTextAreaException: 'Por favor, rellene el campo de entrada con información.',
      TituloExtension: 'Resume, Traduce, Corrige y Charla con la IA',
      Resumir: 'Resumir',
      Traducir: 'Traducir a ',
      Corregir: 'Corregir',
      Chatear: 'Chatear',
      Enviar : 'Enviar',
      EntradaTexto: 'Entrada de texto',
      SalidaTexto: 'Salida de texto',
      Copiar: 'Copiar',
      Borrar: 'Borrar',
      ApiInput : 'Clave API',
      ToolTipVolver: 'Guardar cambios',
      RoleAI: 'Eres un asistente dispuesto a resolver dudas puntuales de la forma más óptima y rápida posible. Responderás en español.'
    },
    Ingles: {
      InvalidAPIKeyException: 'Invalid API key.',
      EmptyTextAreaException: 'Please fill in the input field with information.',
      TituloExtension: 'Resume, Translate, Correct, and Chat with AI',
      Resumir: 'Summarize',
      Traducir: 'Translate to ',
      Corregir: 'Correct',
      Chatear: 'Chat',
      Enviar : 'Send',
      EntradaTexto: 'Text input',
      SalidaTexto: 'Text output',
      Copiar: 'Copy',
      Borrar: 'Clear',
      ApiInput : 'API Key',
      ToolTipVolver: 'Save Changes',
      RoleAI: 'You are an assistant willing to solve specific doubts in the most optimal and fast way possible. You will respond in English.'
    },
    Chino: {
      InvalidAPIKeyException: '无效的API密钥',
      EmptyTextAreaException: '请在输入框中填写信息',
      TituloExtension: '简历、翻译、校对和与人工智能聊天',
      Resumir: '恢复 ',
      Traducir: '翻译成',
      Corregir: '改正',
      Chatear: '聊天',
      Enviar : '请发送',
      EntradaTexto: '文本输入',
      SalidaTexto: '文本输出',
      Copiar: '复制',
      Borrar: '删除',
      ApiInput : 'API密钥',
      ToolTipVolver: '保存更改',
      RoleAI: '你是一位愿意以最优化和最快的方式解决特定问题的助手. 你将用中文回答.'

    }};

  //##########################FUNCTIONS##########################

  function generateResponse(inputText) {
    loadOutput.style.display = 'block';
    const body = {
      model: "gpt-3.5-turbo",
      "messages": [{"role": "system", "content":roleAI},
                  {"role": "user", "content": inputText}],
      temperature: 0.3
    };

    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer "+my_api_key
      },
      body: JSON.stringify(body)
    })
      .then(response => response.json())
      .then(data => {
        loadOutput.style.display = 'none';
        if(data.error){
          if(data.error.code === "invalid_api_key"){
            console.log('Error: Clave API invalida!');
            setErrorMessage("InvalidAPIKeyException");
          }
        }
        var generatedText = data.choices[0].message.content;
        console.log('response: '+generatedText);
        replaceSelectedText(generatedText);
      })
      .catch(error => {});
  }

  function replaceSelectedText(newText) {
    tagTextAreaOutput.value = newText;
    chrome.storage.session.set({ 'historico_output': newText });
  }

  function saveChanges() {
    
    if(divAjustesTagApiKey.value.trim() != ''){
      my_api_key = divAjustesTagApiKey.value;
      chrome.storage.local.set({ 'api_key': my_api_key });
    }
    lang = tagIdiomaAjustes.selectedOptions[0].value;
    chrome.storage.local.set({ 'lang': lang });
    reloadLanguage();
    
  }

  function setErrorMessage(labelKey){
    tagErrorMensaje.innerHTML = Label[lang][labelKey];
    setTimeout(function(){tagErrorMensaje.innerHTML = '';},5000);
  }

  function reloadLanguage(){
    //TITULO DE PROGRAMA (h1)
    document.getElementsByTagName("h1")[0].innerHTML = Label[lang]["TituloExtension"];
    //RADIOBUTTONS
    document.querySelectorAll('input[type="radio"]')[0].nextSibling.data = ' '+Label[lang]["Resumir"] ;
    document.querySelectorAll('input[type="radio"]')[1].nextSibling.data = ' '+Label[lang]["Traducir"] ;
    document.querySelectorAll('input[type="radio"]')[2].nextSibling.data = ' '+Label[lang]["Corregir"] ;
    document.querySelectorAll('input[type="radio"]')[3].nextSibling.data = ' '+Label[lang]["Chatear"] ;
    //BOTON DE ENVIAR
    btnEnviar.innerHTML =  ' '+Label[lang]["Enviar"] ;
    //TITULOS DE LOS ACORDEONES
    document.getElementsByClassName("accordion")[0].innerHTML = ' '+Label[lang]["EntradaTexto"] ;
    document.getElementsByClassName("accordion")[1].innerHTML = ' '+Label[lang]["SalidaTexto"] ;
    //BOTON DE BORRAR TEXTO
    btnBorrarTextAreaInput.innerHTML = ' '+Label[lang]["Borrar"] ;
    btnBorrarTextAreaOutput.innerHTML = ' '+Label[lang]["Borrar"] ;
    //BOTON DE COPIAR TEXTO
    btnCopiarTextAreaInput.innerHTML = ' '+Label[lang]["Copiar"] ;
    btnCopiarTextAreaOutput.innerHTML = ' '+Label[lang]["Copiar"] ;
    //BOTON VOLVER AL MENU PRINCIPAL
    divAjustesBtnVolver.title = ' '+Label[lang]["ToolTipVolver"] ;
    
    labelApiAjustes.innerHTML = Label[lang]["ApiInput"] ;
    //Rol de la IA
    roleAI = Label[lang]["RoleAI"];
  }

  function buscarIndicePorValor(coleccion, valor) {
  for (var i = 0; i < coleccion.length; i++) {
    if (coleccion[i].value === valor) {
      return i;
    }
  }
  // Si no se encuentra el valor, se retorna -1
  return -1;
}


  //##########################LISTENERS##########################
  
  //Acordeon Input
  btnAcordeonInput.children[0].addEventListener("click", function() {

    var panelInput = btnAcordeonInput.children[1];
    this.classList.toggle('active');
    panelInput.style.display = (panelInput.style.display === "block")?"none":"block";
  });

  btnCopiarTextAreaInput.addEventListener('click',function(ev){
    
    navigator.clipboard.writeText(tagTextAreaInput.value);
  });

  btnBorrarTextAreaInput.addEventListener('click',function(ev){
    
    tagTextAreaInput.value = '';
    tagTextAreaInput.dispatchEvent(new Event("change"));//disparo el evento change para que mi listener se ejecute
  });

  tagTextAreaInput.addEventListener('change', function(ev) {

    var textoInput = tagTextAreaInput.value;
    chrome.storage.session.set({ 'historico_input': textoInput })

  });

  //Acordeon Output
  btnAcordeonOutput.children[1].addEventListener("click", function() {

    var panelOutput = btnAcordeonOutput.children[2];
    this.classList.toggle('active');
    panelOutput.style.display = (panelOutput.style.display === "block")?"none":"block";
  });

  btnCopiarTextAreaOutput.addEventListener('click',function(ev){
    
    navigator.clipboard.writeText(tagTextAreaOutput.value);
  });

  btnBorrarTextAreaOutput.addEventListener("click",function(ev){

    tagTextAreaOutput.value = '';
    tagTextAreaOutput.dispatchEvent(new Event("change"));//disparo el evento change para que mi listener se ejecute
  });

  tagTextAreaOutput.addEventListener('change', function(ev) {

    chrome.storage.session.set({ 'historico_output': tagTextAreaOutput.value })

  });

  btnEnviar.addEventListener('click', function(ev) {

    var textoIntroducidoPorUsuario = tagTextAreaInput.value;
    if(textoIntroducidoPorUsuario != null && textoIntroducidoPorUsuario != ''){//SOLO SI LA EN EL OUTPUT SE ENCUENTRA TEXTO INTRODUCIDO POR EL USUARIO SE MANDARA A OPENAI

      const selectedAction = document.querySelector('input[name="opciones"]:checked').value;
      
      switch (selectedAction) {
        case 'summarize':
          generateResponse("Resume el siguiente texto: "+textoIntroducidoPorUsuario);
          break;
        case 'translate':
          var idiomaIntroducido = tagSelectIdioma.selectedOptions[0].value;
          generateResponse("Traduce el siguiente texto al " + idiomaIntroducido + ":" + textoIntroducidoPorUsuario);
          break;
        case 'correct':
          generateResponse("Corrigue gramaticalmete el siguiente texto (sin ninguna explicacion): "+textoIntroducidoPorUsuario);
          break;
        case 'gpt':
          generateResponse(textoIntroducidoPorUsuario);
          break;
      }
    }else{
      setErrorMessage("EmptyTextAreaException");
    }
    
  });

  //Ajustes
  btnAjustes.addEventListener("click",function(ev){
    divAjustes.style.display = "block";
    divMain.style.display = "none";
  });

  divAjustesBtnVolver.addEventListener("click",function(ev){

    saveChanges();
    divAjustes.style.display = "none";
    divMain.style.display = "block";
  });

  ///##########################OTROS##########################


  //##########################OBJETIVOS PENDIENTES##########################

  //TODO METER SELECCION DE IA, COMO BRAND (GOOGLE), CHATGPT (OPENAI), VICUNA (GRATIS 90% DE CHATGPT)
  //TODO METER TEMA OSCURO Y CLARO 
  //TODO METER CHECK PARA GUARDAR EL ULTIMO MENSAJE O NO (INPUT Y OUTPUT)
  //TODO METER UNA BARRITA DE PROGRESO QUE MUESTRE EL GASTO DE LA APIKEY
  //TODO METER UNA SETTING PARA SETEAR LA CANTIDAD DE TOKENS DE SALIDA (DE MENOS A MAS VELOCIDAD, COMO UNA BARRITA DE PROGRESO PERO MOVIL PARA SELECCIONARLA)
  //TODO METER UNA SETTING PARA SETEAR SI SE QUIERE MEMORIA CON LA IA (MEMORIA MENOS RAPIDA LA RESPUESTA)
  //TODO METER UN BOTON PARA COPIAR EL TEXTO DEL RESULTADO - LISTO
  //TODO METER UNA SECCION DE LINK (GITHUB, LINKD, PORTFOLIO, EMAIL)
  //TODO METER PAY ME A COFFE DE MAX 1€ (DONATIVO)
  //TODO AÑADIR UN ROL ESPECIFICO PARA CADA TAREA

  //TODO NUNCA METER ANUNCIOS

  //PARA LA LLAMADA DE VICUNA
/*
  fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Content-Type: 'application/json',
      Authorization : 'Token your_api_key'
    },
    body: JSON.stringify({
      version: 'a68b84083b703ab3d5fbf31b6e25f16be2988e4c3e21fe79c2ff1c18b99e61c1', //vicuna-13b
      input: 'Hola que tal estas'
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
*/

});

  
  
  
