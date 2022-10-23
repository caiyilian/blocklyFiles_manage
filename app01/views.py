from django.shortcuts import render, HttpResponse, redirect
from django.http import JsonResponse
import requests
import json
from django.views.decorators.csrf import csrf_exempt
import os
import time

ip = "42.192.82.19:3001"


# Create your views here.

def login(admname: str, password: str):
    """
    登录后端，用于获取token，token可以用于后面调用各种接口获取各种信息
    :param admname: 用户名，如hgCase
    :param password: 密码:如123456
    :return: 如果登录成功，则返回token
    """

    data = {
        "admname": admname,
        "password": password
    }
    res = requests.post(f"http://{ip}/api/adm/login", data=json.dumps(data))
    if res.status_code == 200:
        data_json = res.json()
        if data_json["code"] == 200:
            return True, res.json()['data']['token']
    return False, None


def uploadBlock(version: str or int, blockfilePath: str, token: str, describle: str = "无描述"):
    """
    上传编程块文件，要压缩成.7z，格式是.7z
    :param version: 该编程块文件的版本号
    :param blockfilePath: 编程块文件的路径
    :param token: token用于认证
    :param describle: 描述，一般是你这个编程块比起之前的版本变化了什么,可以留空，但是不建议留空
    :return:
    """
    if os.path.exists(blockfilePath) is False:
        raise FileExistsError("没有找到这个文件}")
    if blockfilePath.endswith(".7z") is False:
        raise ValueError("只能传递一个.7z压缩包，请把blocklyFiles压缩成.7z格式")
    data = {
        "versionnumber": version,
        "describle": describle,
        "publisher": "hgCase"
    }
    headers = {
        "Authorization": "Bearer " + token
    }

    res = requests.post(f"http://{ip}/api/adm/uploadblock", data=data, headers=headers, files={
        "blockfile": open(blockfilePath, 'rb')})
    if res.status_code == 200:
        data_json = res.json()
        if data_json["code"] == 200:
            return "1"
    return "0"


def getIndex(request, result=''):
    print("getIndex:", result)
    nowTime = "".join(map(str, time.localtime()[0:5]))
    if os.path.exists(".token"):
        with open(".token", "r") as tokenFile:
            lines = tokenFile.readlines()
            lastTime = lines[0].replace("\n", "")
            # 如果距离上次获取token不到一分钟，就继续使用这个token
            if lastTime == nowTime:
                print("使用旧的token")
                token = lines[1].replace("\n", "")
                return render(request, "index.html", {"token": token, "upLoadSuccess": result})
    # 如果文件不存在或者距离上次获取token已经超过一分钟，就重新获取一下token
    success, token = login("hgCase", "123456")
    with open(".token", "w") as tokenFile:
        tokenFile.writelines([nowTime + "\n", token + "\n"])
    print("使用新的token")
    return render(request, "index.html", {"token": token, "upLoadSuccess": result})


@csrf_exempt
def index(request):
    if request.method == 'POST':
        with open("blocklyFiles.7z", "wb") as f:
            for i in request.FILES.get("blockfile").chunks():
                f.write(i)
        result = uploadBlock(request.POST.get("version"), "blocklyFiles.7z", request.POST.get("token").replace(" ", ""),
                             request.POST.get("desc"))
        Return = getIndex(request, result)
        return Return
    else:
        Return = getIndex(request)
        return Return


@csrf_exempt
def delete(request):
    deleteVersion = request.GET.get("deleteVersion")
    token = request.GET.get("Authorization")
    headers = {
        "Authorization": "Bearer " + token.replace(" ", "")
    }
    res = requests.delete(f"http://{ip}/api/adm/deleteblock?versionnumber={deleteVersion}", headers=headers)
    print(res.text)
    if res.status_code == 200:
        data_json = res.json()
        if data_json["code"] == 200:
            return JsonResponse({"success": "true"})
    return JsonResponse({"success": "false"})
