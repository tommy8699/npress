function filelist_init() {
  //files deleter, insertlink
  $("#js-filelist")
    .delegate(".del", "click", function() {
      $(this)
        .parent()
        .fadeOut();
    })
    .delegate(".insertlink", "click", function(event) {
      if (!event.ctrlKey) {
        $("#frmpageEditForm-text").wysiwyg(
          "insertHtml",
          npmacro2tag($(this).attr("data-embed"))
        );
        return false;
      }
    });

  filelist();
}
function filelist() {
  var handleEmptyList = function() {
    var $ul = $(this);
    var $h4 = $ul.prev();
    if ($ul.children().length <= 1) {
      //always contains div.clearitem
      $h4.add($ul).addClass("emptyList");
      $ul.prepend('<div class="item placeholder" />');
    } else {
      $h4.add($ul).removeClass("emptyList");
      $ul.find(".placeholder").remove();
    }
  };

  // files sorter
  $("#js-filelist .list")
    .each(handleEmptyList)
    .sortable({
      items: "> div.item",
      cancel: ".placeholder",
      connectWith: "#js-filelist .list",

      start: function() {
        $("#js-filelist").addClass("ui-dragging");
      },

      //on target list
      receive: function(event, ui) {
        //send request
        var num = $(this).attr("data-num");
        var fid = ui.item.attr("id").split("-")[1];
        var data =
          "changedId=" +
          fid +
          "&num=" +
          num +
          "&" +
          $(this).sortable("serialize");
        $.post($("#js-filelist").attr("data-sortlink"), data);

        //after moving hide file counters in .infoitem
        ui.sender
          .add(this)
          .find(".infoitem small")
          .css("opacity", 0.05);
        ui.sender.data("handled", true);
        handleEmptyList.call(this);
        $(this).append($(".clearitem", this)); //clearitem must be last element
      },

      //on source list
      stop: function(event, ui) {
        $("#js-filelist").removeClass("ui-dragging");
        handleEmptyList.call(this);

        //send data only if not sent in receive
        if ($(this).data("handled")) $(this).data("handled", false);
        else {
          var data = $(this).sortable("serialize");
          $.post($("#js-filelist").attr("data-sortlink"), data);
        }
      }
    });
}

function np_uploadify() {
  var up = $("#fileupload");
  up.change(function() {
    var files = up[0].files;
    if (!files.length) return;
    $("#upload-progress").css("display", "inline");

    var formData = new FormData();
    for (var i = 0; i < files.length; i++) {
      formData.append("files[]", files[i]);
    }

    // https://stackoverflow.com/questions/6974684/how-to-send-formdata-objects-with-ajax-requests-in-jquery
    $.ajax({
      url: up.attr("data-url"),
      type: "POST",
      processData: false,
      contentType: false,
      data: formData,
      dataType: "html", //returned
      error: function(e) {
        console.warn(e);
      },
      success: function(data) {
        console.log("Upload finished: ", data);
        console.log(up.attr("data-afterUploadLink"));
        $.get(up.attr("data-afterUploadLink"));
        up[0].value = "";
      },
      complete: function() {
        $("#upload-progress").css("display", "none");
      },
      // progressbar - http://christopher5106.github.io/web/2015/12/13/HTML5-file-image-upload-and-resizing-javascript-with-progress-bar.html
      xhr: function() {
        var myXhr = $.ajaxSettings.xhr();
        if (myXhr.upload) {
          // For handling the progress of the upload
          myXhr.upload.addEventListener(
            "progress",
            function(e) {
              if (e.lengthComputable) {
                $("#upload-progress")
                  .css("display", "inline")
                  .attr({
                    value: e.loaded,
                    max: e.total
                  });
              }
            },
            false
          );
        }
        return myXhr;
      }
    });
  });

  // $("#fileupload").fileupload({
  //   dataType: "text",
  //   done: function(e, data) {
  //     console.log(e, data);
  //     $.get($("#fileupload").attr("data-afterUploadLink"));
  //
  //     // $.each(data.result.files, function (index, file) {
  //     //   $('<p/>').text(file.name).appendTo(document.body);
  //     // });
  //   }
  // });

  //
  // $("#np-uploadify").uploadify({
  //   script: escape($("#np-uploadify").attr("data-uploadifyHandler")), //bug in uploadify, & would splits flashvar fields
  //   uploader: basePath + "/static/uploadify/uploadify.swf",
  //   cancelImg: basePath + "/static/uploadify/cancel.png",
  //   buttonText: $("#np-uploadify").html(),
  //   multi: true,
  //   auto: true,
  //   scriptData: { uploadify_session: $("#np-uploadify").attr("data-session") },
  //   //'fileExt'        : '*.jpg;*.gif;*.png',
  //   //'fileDesc'       : 'Image Files (.JPG, .GIF, .PNG)',
  //   queueID: "np-uploadify-queue",
  //   //'queueSizeLimit' : 3,
  //   simUploadLimit: 3,
  //   sizeLimit: 100 * 1000 * 1000,
  //   removeCompleted: false,
  //   onSelectOnce: function(event, data) {
  //     //$('#status-message').text(data.filesSelected + ' files have been added to the queue.');
  //   },
  //   onAllComplete: function(event, data) {
  //     $.get($("#np-uploadify").attr("data-afterUploadLink"));
  //     $("#np-uploadify").uploadifyClearQueue();
  //   }
  // });
}

function ajax_upload() {
  $(".ajax_upload").submit(function() {
    var form = this;
    $.ajaxFileUpload({
      url: $(form).attr("action") + "&ajax_upload=true",
      secureuri: false,
      fileElementId: $("input[type=file]", form).attr("id"),
      dataType: "json",
      success: function(data, status) {
        if (typeof data.error != "undefined") {
          if (data.error != "") {
          } else {
            //alert(data.msg);
            //$.get($('#frm-uploadForm').attr('action'));
            $.get($("#np-uploadify").attr("data-afterUploadLink"));

            //if we were uploading just new preview - reload the image
            var img = $("#snippet--editform_editfile .thumbnail");
            img.attr("src", img.attr("src") + "&x=1");
            //img.get(0).reload();
          }
        }
      },
      error: function(data, status, e) {
        alert(e);
      }
    });
    return false;
  });
}

$(function() {
  ajax_upload();
  np_uploadify();
  filelist_init();
});
