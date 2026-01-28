/**
 * 付費會員白名單
 * 這些 email 可以查看會員專屬內容
 */
export const MEMBER_WHITELIST = [
  "tan_meisee@yahoo.com",
  "dalelin@systex.com",
  "linda@tglobalcorp.com",
  "piuo0413@yahoo.com.tw",
  "wendywu@systex.com",
  "jeff_liu@systex.com",
  "winniehuang@systex.com",
  "akaisun@yufengrubber.com.tw",
  "quennlai@systex.com",
  "juliahsu@systex.com",
  "abby_chen@systex.com",
  "ceoassistant@cwgv.com.tw",
  "maggiehuang@systex.com",
  "cszutsung@gmail.com",
  "liv2227@gmail.com",
  "duncan23418@abrealbiotech.com",
  "sandychen0830@gmail.com",
  "sales009@abrealbiotech.com",
  "specialist02@abrealbiotech.com",
  "maggie620806@gmail.com",
  "stan.yin@gmail.com",
  "rabits5218@gmail.com",
  "sam@toolsbiotech.com",
  "phina2@gmail.com",
  "kuotunyh@gmail.com",
  "winniewei@abrealbiotech.com",
  "maxmaitirain@gmail.com",
  "joe0987059@gmail.com",
  "jiune0319@gmail.com",
  "jameskuo0406@gmail.com",
  "shapi.520@gmail.com",
  "specialist@abrealbiotech.com",
  "ritachiu520168@gmail.com",
  "jax@toolsbiotech.com",
  "jlu1005@kimo.com",
  "wayne@toolsbiotech.com",
  "lohas.chao@gmail.com",
  "yeachynlin@gmail.com",
  "mico0904@toolsbiotech.com",
  "shanna@toolsbiotech.com",
  "tingyu@toolsbiotech.com",
  "huangfrade0723@gmail.com",
  "nancy@toolsbiotech.com",
  "nina.uihona@gmail.com",
  "mstan@mail.ntue.edu.tw",
  "molly901213@toolsbiotech.com",
  "chris@toolsbiotech.com",
  "dorinfan117@gmail.com",
  "miniconcha@gmail.com",
  "valeriewong2006@gmail.com",
  "a0983695168@gmail.com",
  "chiachilin61@gmail.com",
  "tannin.wu@toolsbiotech.com",
  "t1979sun@gmail.com",
  "alvin.cho@toolsbiotech.com",
  "nikeshoxmiles@gmail.com",
];

/**
 * 檢查使用者是否為付費會員
 */
export function isPaidMember(email: string | null | undefined): boolean {
  if (!email) return false;
  return MEMBER_WHITELIST.includes(email.toLowerCase());
}
