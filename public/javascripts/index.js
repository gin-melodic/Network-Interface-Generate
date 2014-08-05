/**
 * Created by gin on 14-6-25.
 */

var stepFinishFlag = 0;

$(function(){
  $('#submit').click(function(){
    fileUpload();
  });

  //init ui
  uiInit();

  $(window).resize(function(){
    uiInit();
  });

  $("#fileToUpload").change(function(){
    if (this.value.length > 0) {
      $('#fileNameShow').html('('+this.value+')');
      stepFinishFlag = 1;
    }
    else {
      $('#fileNameShow').html('');
      stepFinishFlag = 0;
    }
    uiInit();
  });
});

var uiInit = function(){
  var contentHeight = $(".content").height();
  $('.step').each(function(){
    $(this).height(contentHeight/3);
  });

  $('.stepTitle').each(function(){
    $(this).css({'font-size':$(".step").height()/4 + 'px'});
  });

  $('div#imageButtonStyle').height($(".step").height()/3).width($(".step").height()/3);



  if ($("#fileToUpload").val().length == 0) {
    $('div#imageButtonStyle').css("background-color","darkgray");
  }
  else {
    $('div#imageButtonStyle').css("background-color","lightgreen");
  }

  if (stepFinishFlag == 0) {
    $('#fileNameShow').html('');
    $("#fileToUpload").val('');
    $("#step2 table").hide();
    $("#step3 table").hide();
  }
  else if (stepFinishFlag == 1) {
    $("#step2 table").show();
    $("#step3 table").hide();
  }
  else if (stepFinishFlag == 2) {
    $("#step2 table").show();
    $("#step3 table").show();
  }

  $('#fileToUpload').css({"left":$("#imageButtonStyle").offset().left+'px',
    "top":$("#imageButtonStyle").offset().top+'px',"width":$("#imageButtonStyle").width(),
    "height":$("#imageButtonStyle").height()});
};

function resetUIInStep(step) {
  $('.dialogBG').hide();
  $('.dialog-warp').hide();
  $('.dialog-warp div.dialog-content p').html("");
  stepFinishFlag = step;
  $(".dialog-warp").click(function(){});
  uiInit();
}

function fileUpload(type) {
  if ($("#fileToUpload").val().length == 0) {
    $('#fileNameShow').html('');
    stepFinishFlag = 0;
    uiInit();
    return;
  }

  $('.dialogBG').show();
  $('.dialog-warp').css("display","table");
  $('.dialog-warp div.dialog-content p').html("处理中...");
  $.ajaxFileUpload
  (
      {
        url:'/',
        secureuri:false,
        fileElementId:'fileToUpload',
        dataType: 'json',
        data: { "type": type },
        success: function (data, status)
        {
          if (data.stat != ErrorCode.SUCCESS) {
            $('.dialog-warp div.dialog-content p').html(data.statDescription);
            $(".dialog-warp").click(function(){
              resetUIInStep(0);
            });
          }
          else {
            $('.dialogBG').hide();
            $('.dialog-warp').hide();
            $('.dialog-warp div.dialog-content p').html("");
            console.log(data, status);
            filePath = data.datas.zipPath;
            stepFinishFlag = 2;
            uiInit();
            $("#download").show().off('click').on('click', function(){
              downloadFile(filePath);
            });
          }
          $("#fileToUpload").change(function(){
            if (this.value.length > 0) {
              $('#fileNameShow').html('('+this.value+')');
              stepFinishFlag = 1;
            }
            else {
              $('#fileNameShow').html('');
              stepFinishFlag = 0;
            }
            uiInit();
          });
        },
        error: function (data, status, e)
        {
          console.error(data, status, e);
          $('.dialog-warp div.dialog-content p').html(data.statDescription);
          $('.dialogBG').hide();
          $('.dialog-warp').hide();
          $('.dialog-warp div.dialog-content p').html("");
          stepFinishFlag = 1;
          uiInit();
        }
      }
  )
}

function sleep(n) {
  var start = new Date().getTime();
  while(true)  if(new Date().getTime()-start > n) break;
}

function downloadFile(filePath) {

  $('#fileNameShow').html('');
  stepFinishFlag = 0;
  uiInit();
  document.location = filePath;
}