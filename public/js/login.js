import axios from "axios"
import { showAlert } from "./alert"
export const login = async (email, password) => {
    try {
        console.log(email,password)
        const res = await axios({
            method: "POST",
            url: "/api/v1/users/login",
            data: {
                email, password
            }

        })
        console.log(res)
        if(res.data.status === "success"){
            showAlert("success","Logged in successfully!")
            window.setTimeout(()=>{
                location.href = '/';
            },1500)
        }
    } catch (err) {
        showAlert("error",err.response.data.message)
    }
}
export const logout = async() => {
    try{
        const res = await axios({
            method:"GET",
            url:"/api/v1/users/logout"
        })
        console.log("try=",res)
        if(res.data.status === "success"){
        showAlert("success","Loggedout successfully.")
        location.reload(true)
        window.location.href = '/';
        }
    }catch(err){
        console.log("error",err.response)
        showAlert("error","Error logging out. Try again!")
    }
}