var clickObj = false; //被点击的那个记录
var deleteButton = null;
var downloadButton = null;
var uploadButton = null;
var inputObj;
var ip = "官网ip地址"
var csrf_token;
var token;
var upLoadSuccess;
var choosenFile = null;

function changeButtonState(canClick, buttonObj) {
    // 改变按钮可点击状态
    buttonObj.disabled = canClick;
    bindHoverEventOnButton(buttonObj, !canClick)

}

function bindHoverEventOnButton(buttonObj, disabled) {
    // 给按钮绑定hover事件
    if (!disabled) {
        buttonObj.style.color = "red"
        buttonObj.onmouseover = function () {
            buttonObj.style.backgroundColor = "#ccc";
            buttonObj.style.cursor = "pointer"
        }
        buttonObj.onmouseout = function () {
            buttonObj.style.backgroundColor = "#efefef"
        }
    } else {
        buttonObj.style.cursor = "default"
        buttonObj.style.color = "gray"
        buttonObj.onmouseover = null
        buttonObj.onmouseout = null
        buttonObj.style.backgroundColor = "#efefef"
    }
}

function changeObjHighLight(target_index) {
    // 当点击了某个版本的编程块之后，那一行高亮,其他就灭
    let blocks = document.getElementsByClassName('obj');
    for (let index = 0; index < blocks.length; index++) {
        var element = blocks[index];
        if (target_index === index) {
            if (element.style.backgroundColor !== "rgb(240, 240, 240)") {
                element.style.backgroundColor = "rgb(240, 240, 240)"
                clickObj = element;
            } else {
                element.style.backgroundColor = "white"
                clickObj = false;
                break
            }

        } else {
            element.style.backgroundColor = "white"
        }

    }
    bindHoverEventOnButton(downloadButton, !clickObj)
    bindHoverEventOnButton(deleteButton, !clickObj)
}

function bindEventOnBlocks() {
    // 给按钮绑定事件
    let blocks = document.getElementsByClassName('obj');
    for (let index = 0; index < blocks.length; index++) {
        var element = blocks[index];
        element.onclick = function () {
            changeObjHighLight(index)
        }
    }
}

function bindEventOnButton() {
    // 给按钮绑定事件
    let buttons = document.getElementsByClassName('buttons')[0].children;
    for (let index = 0; index < buttons.length; index++) {
        let element = buttons[index];
        bindHoverEventOnButton(element, false)
        if (element.innerHTML === "删除") {
            deleteButton = buttons[index]
            changeButtonState(false, buttons[index])
            deleteButton.onclick = function () {
                if (clickObj) {

                    let deleteVersion = clickObj.children[0].innerHTML
                    deleteBlock(deleteVersion)
                }
            }
        } else if (element.innerHTML === "获取") {
            element.onclick = function () {
                getLis();
            }
        } else if (element.innerHTML === "下载") {
            downloadButton = buttons[index]
            changeButtonState(false, buttons[index])
            downloadButton.onclick = function () {
                if (clickObj) {
                    let downloadVersion = clickObj.children[0].innerHTML
                    downloadBlock(downloadVersion)
                }
            }

        } else if (element.innerHTML === "上传") {
            uploadContainer = document.getElementsByClassName("uploadContainer")[0]
            uploadButton = buttons[index]
            uploadButton.onclick = function () {
                uploadContainer.style.display = "flex"
                let buttons = document.getElementsByClassName('buttons')[0].children;
                for (let index = 0; index < buttons.length; index++) {
                    let element = buttons[index];
                    element.onclick = null
                }
            }
        }
    }
}

function clearAllLi() {
    // 清楚showData区域的所有li
    let showDataObj = document.getElementsByClassName("showData")[0]
    let lis = Array.from(showDataObj.children).slice(1)

    for (let index = 0; index < lis.length; index++) {
        const element = lis[index];
        showDataObj.removeChild(element)
    }
    clickObj = false
}

function showDatas(objList) {
    // 输入一个数组，把数组中的所有li全部都展示出来
    clearAllLi()
    var showDataUl = document.getElementsByClassName("showData")[0]
    for (let index = 0; index < objList.length; index++) {
        const element = objList[index];
        showDataUl.insertAdjacentHTML("beforeend", element)
    }
    bindEventOnBlocks()

    bindHoverEventOnButton(deleteButton, true)
    bindHoverEventOnButton(downloadButton, true)

}

// 初始化AJAX，用于发送请求
function ajax(opt) {
    opt = opt || {};
    opt.method = opt.method.toUpperCase() || 'POST';
    opt.url = opt.url || '';
    opt.async = opt.async || true;
    opt.data = opt.data || null;
    opt.success = opt.success || function () {
    };
    opt.headers = opt.headers || {};
    opt.files = opt.files || null
    var xmlHttp = null;
    if (XMLHttpRequest) {
        xmlHttp = new XMLHttpRequest();
    } else {
        xmlHttp = new ActiveXObject('Microsoft.XMLHTTP');
    }
    //

    var params = [];
    for (var key in opt.data) {
        params.push(key + '=' + opt.data[key]);
    }
    var postData = params.join('&');
    if (opt.method.toUpperCase() === 'POST') {
        xmlHttp.open(opt.method, opt.url, opt.async);
        let headersKeys = Object.keys(opt.headers)
        let lengthOfHeaders = headersKeys.length
        for (let index = 0; index < lengthOfHeaders; index++) {
            xmlHttp.setRequestHeader(headersKeys[index], opt.headers[headersKeys[index]])
        }
        xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
        xmlHttp.send(postData);
    } else if (opt.method.toUpperCase() === 'GET') {
        xmlHttp.open(opt.method, opt.url + '?' + postData, opt.async);
        xmlHttp.send(opt.files);
    }
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            opt.success(xmlHttp.responseText);//如果不是json数据可以去掉json转换
        }
    };
}

function getLis() {
    // 发送请求获取所有版本的编程块文件记录
    let pageSize = 10
    let current = 1
    ajax({
        method: 'GET',
        url: `http://${ip}/api/adm/blockversion?pageSize=${pageSize}&current=${current}`,
        success: function (result) {
            result = JSON.parse(result)
            if (result["code"] === 200) {

                let LiList = []
                let li
                let resultList = result['data']['block']
                if (resultList !== null) {
                    for (let index = 0; index < resultList.length; index++) {
                        let Obj = resultList[index];
                        let version = Obj["VersionNumber"];
                        let desc = Obj["Describle"];
                        let createData = new Date(Obj["UpdatedAt"]);
                        let creator = Obj["Publisher"];
                        createData = [createData.getFullYear(), createData.getMonth(), createData.getDate()].join("-")
                        li = `<li class="obj">\
                    <div class="version">${version}</div>\
                    <div class="desc">${desc}</div>\
                    <div class="createDate">${createData}</div>\
                    <div class="creator">${creator}</div>\
                </li>`
                        LiList.push(li)
                    }
                }


                showDatas(LiList)
            }

        }
    })//发送请求
}

function deleteBlock(deleteVersion) {
    if (confirm("确认删除吗") === true) {
        ajax({
            method: 'GET',
            url: `/delete`,
            data: {
                csrfmiddlewaretoken: csrf_token,
                Authorization: token,
                deleteVersion: deleteVersion

            },
            success: function (result) {
                console.log()
                if (JSON.parse(result)["success"] === "true") {
                    getLis()
                }
            }
        })//发送请求
    }

}

function downloadBlock(version) {
    var a = document.createElement('a');
    a.href = `http://${ip}/api/adm/downblockfile?version=${version}`
    a.download = "blocklyFiles.7z";
    a.click();
}

function confirmUpload() {

    ajax({
        method: 'GET',
        url: `http://${ip}/api/adm/blockversion?pageSize=999&current=1`,
        success: function (result) {
            result = JSON.parse(result)
            if (result["code"] === 200) {

                let versionList = []
                let resultList = result['data']['block']
                if (resultList !== null) {
                    for (let index = 0; index < resultList.length; index++) {
                        versionList.push(resultList[index]["VersionNumber"])
                    }
                }
                let version = document.getElementById("version");
                let desc = document.getElementById("desc");
                if (isNaN(Number(version.value.replaceAll(".", ""))) || !version.value) return alert("版本号格式错误")

                if (versionList.indexOf(version.value) === -1) return alert("版本号重复")
                let trueVersion = document.getElementById("trueVersion");
                let trueDesc = document.getElementById("trueDesc");
                trueVersion.value = version.value
                trueDesc.value = desc.value
                let submitButton = document.getElementById("submit")
                submitButton.click()
                bindEventOnButton()
                uploadContainer.style.display = "none"

            }

        }
    })
}

window.onload = function () {
    bindEventOnBlocks();
    bindEventOnButton();
    // 用于发送Ajax请求的token
    csrf_token = document.getElementById("csrf_token").innerText.trim()
    token = document.getElementById("token").innerText.trim()
    upLoadSuccess = document.getElementById("upLoadSuccess").innerText.trim()
    if (upLoadSuccess === "1") {
        alert("成功")
        getLis()
    }
    let uploadCancelButton = document.getElementById("cancel");
    let uploadConfirmButton = document.getElementById("upload");
    uploadCancelButton.onclick = function () {
        bindEventOnButton()
        uploadContainer.style.display = "none"
        choosenFile = null;
        document.getElementById("chooseButton").innerText = "选择文件";
        document.getElementById("version").value = "";
        document.getElementById("desc").value = "";
    }
    uploadConfirmButton.onclick = confirmUpload
    let chooseFileButton = document.getElementById("chooseButton")
    inputObj = document.getElementById('trueFile')
    inputObj.addEventListener("change", function () {
        if (inputObj.files[0]) {
            choosenFile = inputObj.files[0]
            document.getElementById("chooseButton").innerText = "已选择";
        } else {
            choosenFile = null
            document.getElementById("chooseButton").innerText = "选择文件";
        }
    });
    chooseFileButton.onclick = function () {
        inputObj.click()
    }

}
