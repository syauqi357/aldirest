classDiagram
direction BT
class service {
   varchar(120) name
   int(11) price
   varchar(750) description
   int(11) id
}
class service_transactions {
   int(11) service_id
   varchar(120) customer_name
   varchar(18) device_type
   varchar(75) device_brand
   varchar(750) problem
   int(11) price
   timestamp date
   varchar(14) status
   int(11) id
}

service_transactions  -->  service : service_id:id
