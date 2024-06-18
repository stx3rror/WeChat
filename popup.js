document.addEventListener('DOMContentLoaded', function() {

  //##########################VARIABLES##########################

  var my_api_key = "";
  //cuando pruebes usa esta
  //chrome.storage.local.set({ 'api_key': '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' });
  var roleAI = "Eres un asistente dispuesto a resolver dudas puntuales sin extenderte demasiado. Responderás en español.";
  const divMain = document.getElementById("main_container");
  //Acordeon Input
  const btnAcordeonInput = document.getElementsByClassName("accordion")[0];
  const btnCopiarTextAreaInput = document.getElementsByClassName('copiar')[0];
  const btnBorrarTextAreaInput = document.getElementsByClassName('papelera')[0];
  const tagTextAreaInput = document.getElementById("inputArea");
  
  //Acordeon Output
  const btnAcordeonOutput = document.getElementsByClassName("accordion")[1];
  const btnCopiarTextAreaOutput = document.getElementsByClassName('copiar')[1];
  const btnEscucharTextAreaOutput = document.getElementsByClassName('escuchar')[0];
  const btnBorrarTextAreaOutput = document.getElementsByClassName('papelera')[1];
  const tagTextAreaOutput = document.getElementById("outputArea");
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

    chrome.storage.local.get(['lang','historico_output','historico_input','api_key','opcion_checks']).then((result) => {
      
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

      if(result.opcion_checks){        
        array = [...document.getElementsByTagName("input")];
        for(i=0;i<array.length;i++){

          if(array[i].value == result.opcion_checks){
            array[i].checked = true;
            break;
          }
        }
      }

      reloadLanguage();
      divMain.style.display = "flex";
    });  

  //##########################IDIOMA##########################
  const Label = {
    Español: {
      CodigoLenguaje : 'es-ES',
      InvalidAPIKeyException: 'Clave API inválida.',
      EmptyTextAreaException: 'Por favor, rellene el campo de entrada con información.',
      InsufficientQuotaAreaException: 'Has excedido el saldo de tu cartera, Por favor comprueba tu plan y tu plan de pago.',
      TituloExtension: 'Resume, Traduce, Corrige y Charla con la IA',
      Resumir: 'Resumir',
      Traducir: 'Traducir a ',
      Corregir: 'Corregir',
      Chatear: 'Chatear',
      Enviar : 'Enviar',
      EntradaTexto: 'Entrada de texto',
      SalidaTexto: 'Salida de texto',
      Copiar: 'Copiar',
      Escuchar: 'Escuchar',
      Borrar: 'Borrar',
      ApiInput : 'Clave API',
      ToolTipVolver: 'Guardar cambios',
      RoleAI: 'Eres un asistente dispuesto a resolver dudas puntuales de la forma más óptima y rápida posible. Responderás en español.'
    },
    Ingles: {
      CodigoLenguaje : 'en-EN',
      InvalidAPIKeyException: 'Invalid API key.',
      InsufficientQuotaAreaException: 'You have exceeded your wallet balance, please check your plan and your payment plan.',
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
      Escuchar: 'Listen',
      Borrar: 'Clear',
      ApiInput : 'API Key',
      ToolTipVolver: 'Save Changes',
      RoleAI: 'You are an assistant willing to solve specific doubts in the most optimal and fast way possible. You will respond in English.'
    },
    Chino: {
      CodigoLenguaje : 'zh-CN',
      InvalidAPIKeyException: '无效的API密钥',
      InsufficientQuotaAreaException: '您已超出钱包余额，请检查您的计划和付款计划.',
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
      Escuchar: '听',
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
          switch (data.error.code) {
            case 'invalid_api_key':
              console.log('Error: Clave API invalida!');
              setErrorMessage("InvalidAPIKeyException");
              break;
            case 'insufficient_quota':
              console.log('Error: Superado limite monetario!');
              setErrorMessage("InsufficientQuotaAreaException");
              break;

            default:
              console.log('Error: Error desconocido comprueba el data.error!');
          }
        }
        
        var generatedText = data.choices[0].message.content;
        console.log('response: '+generatedText);
        replaceSelectedText(generatedText);
      })
      .catch(error => {});
  }

  // fetch("https://chatgpt-api.shn.hk/v1/", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       // Authorization: "Bearer "+my_api_key

  //     },
  //     body: JSON.stringify(body)
  //   })
  //     .then(response => response.json())
  //     .then(data => {
  //       loadOutput.style.display = 'none';
  //       if(data.error){
  //         if(data.error.code === "invalid_api_key"){
  //           console.log('Error: Clave API invalida!');
  //           setErrorMessage("InvalidAPIKeyException");
  //         }
  //       }
  //       var generatedText = data.choices[0].message.content;
  //       console.log('response: '+generatedText);
  //       replaceSelectedText(generatedText);
  //     })
  //     .catch(error => {});
  // }


  function replaceSelectedText(newText) {
    tagTextAreaOutput.value = newText;
    chrome.storage.local.set({ 'historico_output': newText });
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
    //btnEscucharTextAreaOutput.innerHTML = ' '+Label[lang]["Escuchar"] ;
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
  btnAcordeonInput.addEventListener("click", function() {

    var panelInput = document.getElementsByClassName("panel")[0];
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
    chrome.storage.local.set({ 'historico_input': textoInput })

  });

  //Acordeon Output
  btnAcordeonOutput.addEventListener("click", function() {

    var panelOutput = document.getElementsByClassName("panel")[1];
    this.classList.toggle('active');
    panelOutput.style.display = (panelOutput.style.display === "block")?"none":"block";
  });

  btnCopiarTextAreaOutput.addEventListener('click',function(ev){
    
    navigator.clipboard.writeText(tagTextAreaOutput.value);
  });

  // btnEscucharTextAreaOutput.addEventListener('click',function(ev){
    
  //   text2speech(tagTextAreaOutput.value);
  // });

  btnBorrarTextAreaOutput.addEventListener("click",function(ev){

    tagTextAreaOutput.value = '';
    tagTextAreaOutput.dispatchEvent(new Event("change"));//disparo el evento change para que mi listener se ejecute
  });

  tagTextAreaOutput.addEventListener('change', function(ev) {

    chrome.storage.local.set({ 'historico_output': tagTextAreaOutput.value })

  });

  btnEnviar.addEventListener('click', function(ev) {

    var textoIntroducidoPorUsuario = tagTextAreaInput.value;
    if(textoIntroducidoPorUsuario != null && textoIntroducidoPorUsuario != ''){//SOLO SI LA EN EL OUTPUT SE ENCUENTRA TEXTO INTRODUCIDO POR EL USUARIO SE MANDARA A OPENAI

      const selectedAction = document.querySelector('input[name="opciones"]:checked').value;
      //12-12-2023 - me guardo la opcion seleccionada en cache para mas comodidad
      chrome.storage.local.set({ 'opcion_checks': selectedAction })
      
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

  tagIdiomaAjustes.addEventListener("change",function(ev){

    lang = tagIdiomaAjustes.selectedOptions[0].value;
    chrome.storage.local.set({ 'lang': lang });
    reloadLanguage();
  });

  divAjustesBtnVolver.addEventListener("click",function(ev){

    saveChanges();
    divAjustes.style.display = "none";
    divMain.style.display = "block";
  });

  document.addEventListener("keyup",function(keyPressed){
    if(keyPressed.ctrlKey && (keyPressed.key == 'Enter' || keyPressed.key == 'Intro')){
      btnEnviar.click();
    }
  });

  ///##########################OTROS##########################

  function text2speech(mensaje_a_decir) {
    var msg = new SpeechSynthesisUtterance();
    var voices = window.speechSynthesis.getVoices();
    //es para buscar en la lista de voces aquella que tenga el codigo de lenguaje seleccionado se añade el msg.voices para comprobar cuando ya se ha encontrado y asigando el valor para hacer una especie de break en el forEach, ya que de forma nativa no se puede romper
    voices.forEach(function(k,v){
      if (k["lang"] == Label[lang]["CodigoLenguaje"] && msg.voice == null){  msg.voice = voices[voices.indexOf(k)];}
    })
    msg.voiceURI = "native";
    msg.volume = 1;
    msg.rate = 1;
    msg.pitch = 0.8;
    msg.text = mensaje_a_decir;
    msg.lang = Label[lang]["CodigoLenguaje"];
    speechSynthesis.speak(msg);
  }

  /*window.addEventListener("keyup",function(){
    chrome.windows.getAll(windows => {
      windows.forEach(function(window){
        chrome.tabs.query({id: window.Id}, tab => {
          console.log('Ventana: '+window);
          console.log('Pestaña: '+tab);
        });
      });
    });
  });*/

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
      Authorization : 'Token '+ r8_KTPptWaiWxv7GhPcK6f4df4WvmyMIYs1FjSWF
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

   

  
  
  