const path = require('path');
const fs = require('fs');
const contentDisposition = require('content-disposition')
const nodemailer=require('nodemailer');
const Doctors=require('../models/doctor') 
const User=require('../models/user') 
const Reservation=require('../models/reservation') 
const pdfDocument=require('pdfkit');
const persianDate=require('persian-date');
const session = require('express-session');

const LIMIT_PHOTO_PER_PAGE=9;

let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
      user: 'atb.1394@gmail.com',
      pass: 'v for mafia'
  }
});



  
  


exports.getDoctor = (req, res, next) => {
  const doctor = req.params.doctor;
  var mongooseQuery;
  if(doctor.includes('Dr')){
    mongooseQuery= Doctors.findOne({name:doctor}).select({ name : 1,age:1, educationalDegree : 1,specialty:1,city:1,timeTable:1,_id:0 })

  }else{
    mongooseQuery= Doctors.findOne({medicalSerialNumber:doctor}).select({ name : 1,age:1, educationalDegree : 1,timeTable:1,specialty:1,city:1,_id:0 })

  }
  mongooseQuery
    .then(doctor => {
       var key=Object.keys(doctor.timeTable[0]);
      res.status(200).json({
          message:'Wellcome to '+doctor.name+' Home Page!',
          name:doctor.name,
          specialty:doctor.specialty,
          age:doctor.age,
          'Educational Degree':doctor.educationalDegree,
          'suggested Time For You':key+': '+doctor.timeTable[0][key][0],
          'Time table':doctor.timeTable
  
      })
    })
    .catch(err => console.log(err));
};

exports.postAddtoFavorite=(req, res, next) => {

  const doctor=req.params.doctor ;
  if(doctor.includes('Dr')){
    mongooseQuery= Doctors.findOne({name:doctor}).select({ name : 1,age:1, educationalDegree : 1,specialty:1,username:1,timeTable:1,_id:1 })
    
  }else{
    mongooseQuery= Doctors.findOne({medicalSerialNumber:doctor}).select({ name : 1,age:1, educationalDegree : 1,timeTable:1,specialty:1,username:1,_id:1 })

  }
  mongooseQuery
  .then(doctor => {
      return User.findById(req.userId).then(user=>{
        var favorites=[];
        favorites.push(doctor.name)
            return  user.updateOne({favorites:favorites}).then(result=>{
             return res.status(200).json({
                message:'added successfully',
                doctor:doctor.name
              })
            })
      })

  })

}
exports.getAppointment=(req,res)=>{
  
  const doctor=req.params.doctor;
  const appointment=req.params.appointment;
  var mongooseQuery;

  if(appointment=='acceptSuggested'){
    if(doctor.includes('Dr')){
      mongooseQuery= Doctors.findOne({name:doctor}).select({ name : 1,age:1, educationalDegree : 1,specialty:1,username:1,timeTable:1,_id:1 })
      
    }else{
      mongooseQuery= Doctors.findOne({medicalSerialNumber:doctor}).select({ name : 1,age:1, educationalDegree : 1,timeTable:1,specialty:1,username:1,_id:1 })
  
    }

    mongooseQuery
    .then(doctor => {
       var key=Object.keys(doctor.timeTable[0]);
       var approvedTime=key+': '+doctor.timeTable[0][key][0];
       return User.findById(req.userId).then(user=>{
        const reservation=new Reservation({
          appointment:approvedTime,
          userId:req.userId,
          userUsername:user.username,
          doctorId:doctor._id,
          doctorUsername:doctor.username,
          status:'active'
         })
           reservation.save().then(result=>{
                 
            if(doctor.timeTable[0][key].length>0){
              console.log( doctor.timeTable[0][key][0])
              delete doctor.timeTable[0][key][0];
              doctor.timeTable[0][key].splice(0, 1)
              console.log(doctor.timeTable)
            }else{
              console.log( doctor.timeTable[0][key][0])

              delete doctor.timeTable[0];
              doctor.timeTable.splice(0, 1)
              console.log(doctor.timeTable)
            }
        
            
            
            return doctor.updateOne({timeTable:doctor.timeTable}).then(result=>{
              res.status(200).json({
                message:'Hey '+user.username+' '+ approvedTime+ ' is reserved for you'
              })
            })
              
      
          })
       })
    
    })

 

  }
  
 
  else{

    var key=appointment.split(' ')[0];
    var hour=appointment.split(' ')[1];
    if(doctor.includes('Dr')){
      mongooseQuery= Doctors.findOne({name:doctor}).select({ name : 1,age:1, educationalDegree : 1,specialty:1,username:1,timeTable:1,_id:1 })
      
    }else{
      mongooseQuery= Doctors.findOne({medicalSerialNumber:doctor}).select({ name : 1,age:1, educationalDegree : 1,timeTable:1,specialty:1,username:1,_id:1 })
  
    }

    mongooseQuery
    .then(doctor => {
      //  var key=Object.keys(doctor.timeTable[0]);
      //  var approvedTime=key+': '+doctor.timeTable[0][key][0];
       var approvedTime=key+': '+hour;
       var flag=false
       doctor.timeTable.forEach(time => {
           if(time[key]){
            time[key].forEach(h => {
               if(h==hour){
                flag=true
                return User.findById(req.userId).then(user=>{
                  const reservation=new Reservation({
                    appointment:approvedTime,
                    userId:req.userId,
                    userUsername:user.username,
                    doctorId:doctor._id,
                    doctorUsername:doctor.username,
                    status:'active'
                   })
                     reservation.save().then(result=>{

                      return res.status(200).json({
                        message:'Hey '+user.username+' '+ approvedTime+ ' is reserved for you'
                      })

                    })
                 })
               }
              
             });
             if(!flag){
              return res.status(403).json({
                message:'this time is full :('
              })           }
             }
             
         });
//
     
    
     })

 
  }
}


exports.getIndex = (req, res, next) => {
  const pageNumber=+req.query.page || 1;
 const city=req.query.city||null ;
 const educationalDegree=req.query.educationalDegree||null;
 const specialty=req.query.specialty||null;
  var doctors;
  var mongooseQuery
  console.log(city,educationalDegree)
  if(city && !educationalDegree && !specialty){
     mongooseQuery =  Doctors.find({'city': city}).select({ name : 1,age:1, educationalDegree : 1,specialty:1, city:1,_id:0 })
  }
  if(!city && educationalDegree && !specialty){
     mongooseQuery =  Doctors.find({'educationalDegree': educationalDegree}).select({ name : 1,age:1, educationalDegree : 1,specialty:1,city:1,_id:0 })

  }
  if(city && educationalDegree && !specialty){
     mongooseQuery =  Doctors.find({'city': city,'educationalDegree': educationalDegree}).select({ name : 1,age:1, educationalDegree : 1,specialty:1,city:1,_id:0 })

  } if(city && educationalDegree && specialty){
    mongooseQuery =  Doctors.find({'city': city,'educationalDegree': educationalDegree,'specialty':specialty}).select({ name : 1,age:1, educationalDegree : 1,specialty:1,city:1,_id:0 })

 }
 if(!city && educationalDegree && specialty){
  mongooseQuery =  Doctors.find({'educationalDegree': educationalDegree,'specialty':specialty}).select({ name : 1,age:1, educationalDegree : 1,specialty:1,city:1,_id:0 })
  console.log(educationalDegree,city)

}
 if(city && !educationalDegree && specialty){
  mongooseQuery =  Doctors.find({'city': city,'specialty':specialty}).select({ name : 1,age:1, educationalDegree : 1,specialty:1,city:1,_id:0 })
  console.log(educationalDegree,city)

}

  if(!city && !educationalDegree && specialty){
    mongooseQuery =  Doctors.find({'specialty':specialty}).select({ name : 1,age:1, educationalDegree : 1,specialty:1,city:1,_id:0 })
    console.log('nothing')

  }
  if(!city && !educationalDegree && !specialty){
    mongooseQuery =  Doctors.find().select({ name : 1,age:1, educationalDegree : 1,specialty:1,city:1,_id:0 })
    console.log('nothing')

  }
  mongooseQuery.then(doctorDocument=>{
    console.log(doctorDocument)
    doctors=doctorDocument;
    return doctors
  })
    .then(doctors => {
    return res.status(200).json({
      doctors:doctors,
      message:'this is a list of our doctors,now you can choose a plan. also you can filter them by your preferd interests.'
    })
    })
    .catch(err => {
      console.log(err);
      const error=new Error(err);
      error.httpStatusCode=500;
      error.message='خطا هنگام نمایش لیست دکتر ها به کاربر';
      console.log(error.message)
      return next(error);
    });
  
  }

  
  

